import {
  log,
  crypto,
  BigInt,
  Address,
  ethereum,
  ByteArray,
} from "@graphprotocol/graph-ts";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { getPriceOfOutputTokens } from "./Price";
import { updateRevenueSnapshots } from "./Revenue";
import { getOrCreateVault } from "../common/initializers";
import { Vault as VaultContract } from "../../generated/Registry_v1/Vault";
import { Strategy as StrategyContract } from "../../generated/Registry_v1/Strategy";

function getSharesMinted(
  eventAdress: Address,
  from: Address,
  to: Address,
  event: ethereum.Event
): BigInt {
  const receipt = event.receipt;
  if (!receipt) return constants.BIGINT_ZERO;

  const logs = event.receipt!.logs;
  if (!logs) return constants.BIGINT_ZERO;

  for (let i = 0; i < logs.length; ++i) {
    const currentLog = logs.at(i);
    const topic_signature = currentLog.topics.at(0);
    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      const _from = ethereum
        .decode("address", currentLog.topics.at(1))!
        .toAddress();
      const _to = ethereum
        .decode("address", currentLog.topics.at(2))!
        .toAddress();

      if (
        _from.equals(from) &&
        _to.equals(to) &&
        currentLog.address.equals(eventAdress)
      ) {
        const data_value = ethereum.decode("uint256", currentLog.data);
        if (!data_value) {
          return constants.BIGINT_ZERO;
        }
        return data_value.toBigInt();
      }
    }
  }
  return constants.BIGINT_ZERO;
}

export function strategyReported(
  gain: BigInt,
  vaultAddress: Address,
  strategyAddress: Address,
  event: ethereum.Event
): void {
  const vault = getOrCreateVault(vaultAddress, event.block);
  const vaultContract = VaultContract.bind(vaultAddress);

  const strategyContract = StrategyContract.bind(strategyAddress);
  const strategistAddress = utils.readValue<Address>(
    strategyContract.try_strategist(),
    constants.NULL.TYPE_ADDRESS
  );

  const vaultVersion = utils.readValue<string>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_4_3
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return;
  }

  const sharesMintedToTreasury = getSharesMinted(
    vaultAddress,
    vaultAddress,
    constants.YEARN_TREASURY_VAULT,
    event
  );

  let sharesMintedToStrategist = constants.BIGINT_ZERO;

  if (strategistAddress.equals(constants.NULL.TYPE_ADDRESS)) {
    sharesMintedToStrategist = getSharesMinted(
      vaultAddress,
      vaultAddress,
      strategistAddress,
      event
    );
  }

  if (sharesMintedToStrategist.equals(constants.BIGINT_ZERO)) {
    sharesMintedToStrategist = getSharesMinted(
      vaultAddress,
      vaultAddress,
      strategyAddress,
      event
    );
  }

  const inputToken = Address.fromString(vault.inputToken);
  const inputTokenPrice = getUsdPricePerToken(inputToken);
  const inputTokenDecimals = utils.getTokenDecimals(inputToken);

  const totalGainUSD = gain
    .divDecimal(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  const outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputToken,
    inputTokenDecimals
  );
  const outputTokenDecimals = utils.getTokenDecimals(vaultAddress);

  const strategistRewardUSD = sharesMintedToStrategist
    .divDecimal(outputTokenDecimals)
    .times(outputTokenPriceUSD);

  const protocolFees = sharesMintedToTreasury
    .divDecimal(outputTokenDecimals)
    .times(outputTokenPriceUSD);

  let supplySideRevenueUSD = totalGainUSD
    .minus(strategistRewardUSD)
    .minus(protocolFees);

  if (supplySideRevenueUSD.lt(constants.BIGDECIMAL_ZERO))
    supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;

  let protocolSideRevenueUSD = protocolFees.plus(strategistRewardUSD);

  // Incident: 2021-05-20
  // Reference: https://github.com/yearn/yearn-security/blob/master/disclosures/2021-05-20.md#References
  if (constants.BLACKLISTED_TRANSACTION.includes(event.transaction.hash)) {
    supplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
  }

  vault.outputTokenSupply = utils.readValue<BigInt>(
    vaultContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );
  vault.save();

  updateRevenueSnapshots(
    vault,
    supplySideRevenueUSD,
    protocolSideRevenueUSD,
    event.block
  );

  log.warning(
    "[Report] vault: {}, strategy: {}, gain: {}, strategistReward: {}, treasuryFees: {}, Txn: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      gain.toString(),
      sharesMintedToStrategist.toString(),
      sharesMintedToTreasury.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

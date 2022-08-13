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

function getSharesMinted(
  eventAdress: Address,
  from: Address,
  to: Address,
  event: ethereum.Event
): BigInt {
  let receipt = event.receipt;
  if (!receipt) return constants.BIGINT_ZERO;

  let logs = event.receipt!.logs;
  if (!logs) return constants.BIGINT_ZERO;

  for (let i = 0; i < logs.length; ++i) {
    let log = logs.at(i);
    let topic_signature = log.topics.at(0);
    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      let _from = ethereum.decode("address", log.topics.at(1))!.toAddress();
      let _to = ethereum.decode("address", log.topics.at(2))!.toAddress();

      if (_from == from && _to == to && log.address == eventAdress) {
        let data_value = ethereum.decode("uint256", log.data);

        if (!data_value) {
          return constants.BIGINT_ZERO;
        }
        return data_value!.toBigInt();
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

  const vaultVersion = utils.readValue<String>(
    vaultContract.try_apiVersion(),
    constants.VaultVersions.v0_4_3
  );

  // skipping yearn vaults with version less than 0.3.0
  if (vaultVersion.split(".")[1] == "2") {
    return;
  }

  let sharesMintedToTreasury = getSharesMinted(
    vaultAddress,
    vaultAddress,
    constants.YEARN_TREASURY_VAULT,
    event
  );

  let sharesMintedToStrategist = getSharesMinted(
    vaultAddress,
    vaultAddress,
    strategyAddress,
    event
  );

  let inputToken = Address.fromString(vault.inputToken);
  let inputTokenPrice = getUsdPricePerToken(inputToken);
  let inputTokenDecimals = utils.getTokenDecimals(inputToken);

  let totalGainUSD = gain
    .divDecimal(inputTokenDecimals)
    .times(inputTokenPrice.usdPrice)
    .div(inputTokenPrice.decimalsBaseTen);

  let outputTokenPriceUSD = getPriceOfOutputTokens(
    vaultAddress,
    inputToken,
    inputTokenDecimals
  );
  let outputTokenDecimals = utils.getTokenDecimals(vaultAddress);

  let strategistRewardUSD = sharesMintedToStrategist
    .divDecimal(outputTokenDecimals)
    .times(outputTokenPriceUSD);

  let supplySideRevenueUSD = totalGainUSD.plus(strategistRewardUSD);

  let protocolSideRevenueUSD = sharesMintedToTreasury
    .divDecimal(outputTokenDecimals)
    .times(outputTokenPriceUSD);

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
      sharesMintedToStrategist.toHexString(),
      sharesMintedToTreasury.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

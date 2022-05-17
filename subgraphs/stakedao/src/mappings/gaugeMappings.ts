import {
  updateRewardTokenEmission,
  updateFinancialsAfterRewardAdded,
} from "../modules/Reward";
import {
  RewardAdded,
  AddRewardCall,
  Gauge as GaugeContract,
} from "../../generated/templates/Gauge/Gauge";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../Prices";
import * as constants from "../common/constants";
import { Vault as VaultStore } from "../../generated/schema";
import { log, BigInt, Address } from "@graphprotocol/graph-ts";
import { getOrCreateRewardToken } from "../common/initializers";
import { Strategy as StrategyContract } from "../../generated/controller/Strategy";

export function handleAddReward(call: AddRewardCall): void {
  const gaugeAddress = call.to;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const vaultAddress = gaugeContract.stakingToken();
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (vault) {
    let rewardTokensIds: string[] = [];
    let rewardTokenAddress: Address;

    // Assuming that their are a maximum of 10 rewardTokens in the vault.
    for (let i = 0; i <= 10; i++) {
      rewardTokenAddress = utils.readValue<Address>(
        gaugeContract.try_rewardTokens(BigInt.fromI32(i)),
        constants.ZERO_ADDRESS
      );

      const rewardToken = getOrCreateRewardToken(rewardTokenAddress);
      rewardTokensIds.push(rewardToken.id);
    }
    vault.rewardTokens = rewardTokensIds;
    vault._rewardTokensIds = rewardTokensIds;
    vault.save();

    log.warning(
      "[Gauge: AddReward] vaultId: {}, gaugeId: {}, rewardTokensIds: {}",
      [
        vaultAddress.toHexString(),
        gaugeAddress.toHexString(),
        rewardTokensIds.join(", "),
      ]
    );
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  const gaugeAddress = event.address;
  const gaugeContract = GaugeContract.bind(gaugeAddress);

  const vaultAddress = gaugeContract.stakingToken();
  const vault = VaultStore.load(vaultAddress.toHexString());

  if (!vault) return;

  const strategyAddress = Address.fromString(vault._strategy);
  const strategyContract = StrategyContract.bind(strategyAddress);

  let performanceFee = utils
    .readValue<BigInt>(
      strategyContract.try_performanceFee(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  const rewardEarned = event.params.reward.toBigDecimal();

  let rewardTokenAddress = Address.fromString(vault!._rewardTokensIds[0]);
  let rewardTokenPrice = getUsdPricePerToken(rewardTokenAddress);
  let rewardTokenDecimals = constants.BIGINT_TEN.pow(
    utils.getTokenDecimals(rewardTokenAddress).toI32() as u8
  ).toBigDecimal();

  let supplySideRewardEarned = rewardEarned.times(
    constants.BIGDECIMAL_ONE.minus(performanceFee.div(constants.DENOMINATOR))
  );
  const supplySideRewardEarnedUSD = supplySideRewardEarned
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice)
    .div(rewardTokenPrice.decimalsBaseTen);

  let protocolSideRewardEarned = rewardEarned
    .times(performanceFee)
    .div(constants.BIGDECIMAL_HUNDRED);
  const protocolSideRewardEarnedUSD = protocolSideRewardEarned
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice)
    .div(rewardTokenPrice.decimalsBaseTen);

  const totalRevenueUSD = supplySideRewardEarnedUSD.plus(
    protocolSideRewardEarnedUSD
  );

  vault.inputTokenBalance = vault.inputTokenBalance.plus(event.params.reward);
  vault.save();

  updateRewardTokenEmission(
    vaultAddress,
    gaugeAddress,
    0,
    rewardTokenAddress,
    rewardTokenDecimals,
    rewardTokenPrice
  );

  updateFinancialsAfterRewardAdded(
    event.block,
    totalRevenueUSD,
    supplySideRewardEarnedUSD,
    protocolSideRewardEarnedUSD
  );

  log.warning(
    "[RewardAdded] vault: {}, Strategy: {}, Gauge: {}, supplySideRewardEarned: {}, protocolSideRewardEarned: {}, rewardToken: {}, totalRevenueUSD: {}, TxHash: {}",
    [
      vaultAddress.toHexString(),
      strategyAddress.toHexString(),
      gaugeAddress.toHexString(),
      supplySideRewardEarned.toString(),
      protocolSideRewardEarned.toString(),
      rewardTokenAddress.toHexString(),
      totalRevenueUSD.toString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

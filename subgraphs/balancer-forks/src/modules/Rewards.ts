import {
  getOrCreateRewardToken,
  getOrCreateLiquidityPool,
  getOrCreateToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import { readValue } from "../common/utils";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/gauge/Gauge";
import { GaugeController as GaugeControllereContract } from "../../generated/GaugeController/GaugeController";

export function getRewardsData(gaugeAddress: Address): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const rewardCount = utils.readValue<BigInt>(
    gaugeContract.try_reward_count(),
    constants.BIGINT_TEN
  );

  for (let idx = 0; idx < rewardCount.toI32(); idx++) {
    const rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) continue;

    rewardTokens.push(rewardToken);

    const rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      const rewardRate = rewardRateCall.value.rate;

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateControllerRewards(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const gaugeControllerContract = GaugeControllereContract.bind(
    constants.GAUGE_CONTROLLER_ADDRESS
  );

  // Returns BIGINT_ZERO if the weight is zero or the GaugeControllerContract is the childChainLiquidityGaugeFactory version.
  const gaugeRelativeWeight = utils
    .readValue<BigInt>(
      gaugeControllerContract.try_gauge_relative_weight(gaugeAddress),
      constants.BIGINT_ZERO
    )
    .divDecimal(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    );

  // This essentially checks if the gauge is a GaugeController gauge instead of a childChainLiquidityGaugeFactory contract.
  if (gaugeRelativeWeight.equals(constants.BIGDECIMAL_ZERO)) {
    return;
  }

  const protocolToken = getOrCreateRewardToken(
    constants.PROTOCOL_TOKEN_ADDRESS,
    constants.RewardTokenType.DEPOSIT,
    block
  );

  // Get the rewards per day for this gauge
  const protocolTokenRewardEmissionsPerDay =
    protocolToken._inflationPerDay!.times(gaugeRelativeWeight);

  updateRewardTokenEmissions(
    constants.PROTOCOL_TOKEN_ADDRESS,
    poolAddress,
    BigInt.fromString(
      protocolTokenRewardEmissionsPerDay.truncate(0).toString()
    ),
    block
  );
}

export function updateStakedOutputTokenAmount(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  // Update the staked output token amount for the pool ///////////
  const pool = getOrCreateLiquidityPool(poolAddress, block);
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const gaugeWorkingSupply = utils.readValue<BigInt>(
    gaugeContract.try_working_supply(),
    constants.BIGINT_ZERO
  );

  pool.stakedOutputTokenAmount = gaugeWorkingSupply;
  pool.save();
}

export function updateFactoryRewards(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  // Get data for all reward tokens for this gauge
  const rewardsInfo = getRewardsData(gaugeAddress);

  const rewardTokens = rewardsInfo.getRewardTokens;
  const rewardRates = rewardsInfo.getRewardRates;

  for (let i = 0; i < rewardTokens.length; i += 1) {
    const rewardToken = rewardTokens[i];
    const rewardRate = rewardRates[i];

    const rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      rewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    const rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

    updateRewardTokenEmissions(rewardToken, poolAddress, rewardPerDay, block);

    log.warning("[Rewards] Pool: {}, RewardToken: {}, RewardRate: {}", [
      poolAddress.toHexString(),
      rewardToken.toHexString(),
      rewardRatePerDay.toString(),
    ]);
  }
}

export function updateRewardTokenEmissions(
  rewardTokenAddress: Address,
  poolAddress: Address,
  rewardTokenPerDay: BigInt,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);
  const rewardToken = getOrCreateRewardToken(
    rewardTokenAddress,
    constants.RewardTokenType.DEPOSIT,
    block
  );

  if (!pool.rewardTokens) {
    pool.rewardTokens = [];
  }

  const rewardTokens = pool.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!pool.rewardTokenEmissionsAmount) {
    pool.rewardTokenEmissionsAmount = [];
  }
  const rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;

  if (!pool.rewardTokenEmissionsUSD) {
    pool.rewardTokenEmissionsUSD = [];
  }
  const rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

  const rewardTokenPrice = getOrCreateToken(rewardTokenAddress, block.number);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .divDecimal(
      constants.BIGINT_TEN.pow(rewardTokenPrice.decimals as u8).toBigDecimal()
    )
    .times(rewardTokenPrice.lastPriceUSD!);

  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool.save();
}

export function getPoolFromGauge(gaugeAddress: Address): Address | null {
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  const poolAddress = readValue<Address>(
    gaugeContract.try_lp_token(),
    constants.NULL.TYPE_ADDRESS
  );

  if (poolAddress.equals(constants.NULL.TYPE_ADDRESS)) return null;

  return poolAddress;
}

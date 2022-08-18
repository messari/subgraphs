import {
  getOrCreateRewardToken,
  getOrCreateLiquidityPool,
  getOrCreateToken,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { log, BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/gauge/Gauge";
import { GaugeController as GaugeControllereContract } from "../../generated/GaugeController/GaugeController";

export function getRewardsData(gaugeAddress: Address): RewardsInfoType {
  let rewardRates: BigInt[] = [];
  let rewardTokens: Address[] = [];

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  let rewardCount = utils.readValue<BigInt>(
    gaugeContract.try_reward_count(),
    constants.BIGINT_TEN
  );

  for (let idx = 0; idx < rewardCount.toI32(); idx++) {
    let rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) continue;

    rewardTokens.push(rewardToken);

    let rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      let rewardRate = rewardRateCall.value.rate;

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateBalancerRewards(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  let gaugeControllerContract = GaugeControllereContract.bind(
    constants.GAUGE_CONTROLLER_ADDRESS
  );

  let gaugeRelativeWeight = utils
    .readValue<BigInt>(
      gaugeControllerContract.try_gauge_relative_weight(gaugeAddress),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  if (gaugeRelativeWeight.equals(constants.BIGDECIMAL_ZERO)) return;

  let gaugeWorkingSupply = utils
    .readValue<BigInt>(
      gaugeContract.try_working_supply(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let balRewardEmissionsPerDay =
    constants.DAILY_BAL_EMISSIONS.times(gaugeRelativeWeight);

  pool.stakedOutputTokenAmount = BigInt.fromString(
    constants.BIGINT_ONE.divDecimal(
      constants.BIGDECIMAL_POINT_FOUR.div(
        gaugeWorkingSupply.plus(constants.BIGDECIMAL_POINT_FOUR)
      )
    )
      .truncate(0)
      .toString()
  );
  pool.save();

  updateRewardTokenEmissions(
    constants.BALANCER_TOKEN_ADDRESS,
    poolAddress,
    BigInt.fromString(balRewardEmissionsPerDay.truncate(0).toString()),
    block
  );
}

export function updateRewardTokenInfo(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  let rewardsInfo = getRewardsData(gaugeAddress);

  let rewardTokens = rewardsInfo.getRewardTokens;
  let rewardRates = rewardsInfo.getRewardRates;

  for (let i = 0; i < rewardTokens.length; i += 1) {
    let rewardToken = rewardTokens[i];
    let rewardRate = rewardRates[i];

    let rewardRatePerDay = getRewardsPerDay(
      block.timestamp,
      block.number,
      rewardRate.toBigDecimal(),
      constants.RewardIntervalType.TIMESTAMP
    );

    let rewardPerDay = BigInt.fromString(rewardRatePerDay.toString());

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
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block.number);

  if (!pool.rewardTokens) {
    pool.rewardTokens = [];
  }

  let rewardTokens = pool.rewardTokens!;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens;
  }

  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);

  if (!pool.rewardTokenEmissionsAmount) {
    pool.rewardTokenEmissionsAmount = [];
  }
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount!;

  if (!pool.rewardTokenEmissionsUSD) {
    pool.rewardTokenEmissionsUSD = [];
  }
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD!;

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

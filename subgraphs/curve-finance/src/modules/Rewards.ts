import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateRewardToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { Rewards as PoolRewardsContract } from "../../generated/templates/PoolTemplate/Rewards";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";
import { GaugeController as GaugeControllereContract } from "../../generated/GaugeController/GaugeController";

export function getRewardsData_v1(gaugeAddress: Address): RewardsInfoType {
  let rewardRates: BigInt[] = [];
  let rewardTokens: Address[] = [];

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  let rewardCount = utils
    .readValue<BigInt>(gaugeContract.try_reward_count(), constants.BIGINT_TEN);

  for (let idx = 0; idx < rewardCount.toI32(); idx++) {
    let rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) continue;

    rewardTokens.push(rewardToken);

    let rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      let rewardRate = rewardRateCall.value.getRate();

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function getRewardsData_v2(gaugeAddress: Address): RewardsInfoType {
  let rewardRates: BigInt[] = [];
  let rewardTokens: Address[] = [];

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  let rewardToken = utils.readValue<Address>(
    gaugeContract.try_rewarded_token(),
    constants.NULL.TYPE_ADDRESS
  );

  if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
    rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(constants.BIGINT_ZERO),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS))
      new RewardsInfoType([], []);
  }

  rewardTokens.push(rewardToken);

  let rewardContractAddress = utils.readValue<Address>(
    gaugeContract.try_reward_contract(),
    constants.NULL.TYPE_ADDRESS
  );

  let rewardContract = PoolRewardsContract.bind(rewardContractAddress);
  let rewardRate = utils.readValue<BigInt>(
    rewardContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );
  rewardRates.push(rewardRate);

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateCrvRewardsInfo(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  let gaugeControllerContract = GaugeControllereContract.bind(
    constants.Mainnet.GAUGE_CONTROLLER_ADDRESS
  );

  let inflationRate = utils
    .readValue<BigInt>(
      gaugeContract.try_inflation_rate(),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let gaugeRelativeWeight = utils
    .readValue<BigInt>(
      gaugeControllerContract.try_gauge_relative_weight(gaugeAddress),
      constants.BIGINT_ZERO
    )
    .toBigDecimal();

  let gaugeWorkingSupply = utils.readValue<BigInt>(
    gaugeContract.try_working_supply(),
    constants.BIGINT_ZERO
  );

  // rewards = inflation_rate * gauge_relative_weight * 86_400 * 0.4
  let crvRewardEmissionsPerDay = inflationRate
    .times(gaugeRelativeWeight.div(constants.BIGINT_TEN.pow(18).toBigDecimal()))
    .times(BigDecimal.fromString(constants.SECONDS_PER_DAY.toString()))
    .times(BigDecimal.fromString("0.4"));

  updateRewardTokenEmissions(
    constants.Mainnet.CRV_TOKEN_ADDRESS,
    poolAddress,
    BigInt.fromString(crvRewardEmissionsPerDay.truncate(0).toString()),
    block
  );
  pool.stakedOutputTokenAmount = gaugeWorkingSupply;
  pool.save();
}

export function updateRewardTokenInfo(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  let rewardsInfo = getRewardsData_v1(gaugeAddress);

  if (rewardsInfo.isEmpty()) {
    rewardsInfo = getRewardsData_v2(gaugeAddress);
  }

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
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress);

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

  const rewardTokenPrice = getUsdPricePerToken(rewardTokenAddress);
  const rewardTokenDecimals = utils.getTokenDecimals(rewardTokenAddress);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(rewardTokenDecimals)
    .times(rewardTokenPrice.usdPrice)
    .div(rewardTokenPrice.decimalsBaseTen);

  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool.save();
}

import {
  log,
  BigInt,
  Address,
  ethereum,
  dataSource,
} from "@graphprotocol/graph-ts";
import {
  getOrCreateToken,
  getOrCreateRewardToken,
  getOrCreateLiquidityPool,
} from "../common/initializers";
import * as utils from "../common/utils";
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
  let rewardCount = utils.readValue<BigInt>(
    gaugeContract.try_reward_count(),
    constants.BIGINT_ZERO
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
      let rewardRate = rewardRateCall.value.getRate();

      rewardRates.push(rewardRate);
    } else {
      rewardRates.push(constants.BIGINT_ZERO);
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function getRewardsData_v2(gaugeAddress: Address): RewardsInfoType {
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  let rewardToken = utils.readValue<Address>(
    gaugeContract.try_rewarded_token(),
    constants.NULL.TYPE_ADDRESS
  );

  if (rewardToken.equals(constants.NULL.TYPE_ADDRESS))
    return new RewardsInfoType([], []);

  let rewardContractAddress = utils.readValue<Address>(
    gaugeContract.try_reward_contract(),
    constants.NULL.TYPE_ADDRESS
  );

  if (rewardContractAddress.equals(constants.NULL.TYPE_ADDRESS))
    return new RewardsInfoType([], []);

  const rewardsContract = PoolRewardsContract.bind(rewardContractAddress);

  let rewardRate = utils.readValue<BigInt>(
    rewardsContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );

  return new RewardsInfoType([rewardToken], [rewardRate]);
}

export function getRewardsData_v3(gaugeAddress: Address): RewardsInfoType {
  let rewardRates: BigInt[] = [];
  let rewardTokens: Address[] = [];

  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  for (let idx = 0; idx < 5; idx++) {
    let rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
      return new RewardsInfoType(rewardTokens, rewardRates);
    }

    rewardTokens.push(rewardToken);

    let rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      let rewardRate = rewardRateCall.value.getRate();

      rewardRates.push(rewardRate);
    } else {
      let rewardRate1Call = gaugeContract.try_reward_data1(rewardToken);

      if (!rewardRate1Call.reverted) {
        let rewardRate = rewardRate1Call.value.rate;

        rewardRates.push(rewardRate);
      } else {
        rewardRates.push(constants.BIGINT_ZERO);
      }
    }
  }

  return new RewardsInfoType(rewardTokens, rewardRates);
}

export function updateStakedOutputTokenAmount(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  let gaugeTotalSupply = utils.readValue<BigInt>(
    gaugeContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.stakedOutputTokenAmount = gaugeTotalSupply;

  if (utils.equalsIgnoreCase(dataSource.network(), constants.Network.MAINNET)) {
    let gaugeWorkingSupply = utils.readValue<BigInt>(
      gaugeContract.try_working_supply(),
      constants.BIGINT_ZERO
    );
    pool.stakedOutputTokenAmount = gaugeWorkingSupply;
  }

  pool.save();
}

export function updateControllerRewards(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  let gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  let gaugeControllerContract = GaugeControllereContract.bind(
    constants.GAUGE_CONTROLLER_ADDRESS
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
    .divDecimal(
      constants.BIGINT_TEN.pow(
        constants.DEFAULT_DECIMALS.toI32() as u8
      ).toBigDecimal()
    );

  if (
    !utils.equalsIgnoreCase(dataSource.network(), constants.Network.MAINNET)
  ) {
    let lastRequest = utils.readValue<BigInt>(
      gaugeControllerContract.try_last_request(gaugeAddress),
      constants.BIGINT_ZERO
    );
    let weekNumber = lastRequest.div(constants.NUMBER_OF_WEEKS_DENOMINATOR);

    inflationRate = utils
      .readValue<BigInt>(
        gaugeContract.try_inflation_rate1(weekNumber),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();

    gaugeRelativeWeight = constants.BIGDECIMAL_POINT_FOUR;
  }

  // Get the rewards per day for this gauge
  let protocolTokenRewardEmissionsPerDay = inflationRate
    .times(gaugeRelativeWeight)
    .times(constants.BIG_DECIMAL_SECONDS_PER_DAY);

  updateRewardTokenEmissions(
    constants.CRV_TOKEN_ADDRESS,
    poolAddress,
    BigInt.fromString(
      protocolTokenRewardEmissionsPerDay.truncate(0).toString()
    ),
    block
  );
}

export function updateFactoryRewards(
  poolAddress: Address,
  gaugeAddress: Address,
  block: ethereum.Block
): void {
  let rewardsInfo = getRewardsData_v1(gaugeAddress);

  if (rewardsInfo.isEmpty()) {
    rewardsInfo = getRewardsData_v2(gaugeAddress);
  }

  if (rewardsInfo.isEmpty()) {
    rewardsInfo = getRewardsData_v3(gaugeAddress);
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
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

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

  const token = getOrCreateToken(rewardTokenAddress, block);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .toBigDecimal()
    .div(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(token.lastPriceUSD!);

  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  pool.save();
}

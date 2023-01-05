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
import { getUsdPricePerToken } from "../prices";
import * as constants from "../common/constants";
import { RewardsInfoType } from "../common/types";
import { getRewardsPerDay } from "../common/rewards";
import { Rewards as PoolRewardsContract } from "../../generated/templates/PoolTemplate/Rewards";
import { Gauge as LiquidityGaugeContract } from "../../generated/templates/LiquidityGauge/Gauge";
import { GaugeController as GaugeControllereContract } from "../../generated/GaugeController/GaugeController";

export function getRewardsData_v1(
  gaugeAddress: Address,
  block: ethereum.Block
): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  const rewardCount = utils.readValue<BigInt>(
    gaugeContract.try_reward_count(),
    constants.BIGINT_ZERO
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
      const rewardRate = rewardRateCall.value.getRate();
      const periodFinish = rewardRateCall.value.getPeriod_finish();

      if (periodFinish.lt(block.timestamp)) {
        rewardRates.push(constants.BIGINT_ZERO);
      } else {
        rewardRates.push(rewardRate);
      }
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

  if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
    rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(constants.BIGINT_ZERO),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS))
      return new RewardsInfoType([], []);
  }

  const rewardContractAddress = utils.readValue<Address>(
    gaugeContract.try_reward_contract(),
    constants.NULL.TYPE_ADDRESS
  );

  if (rewardContractAddress.equals(constants.NULL.TYPE_ADDRESS))
    return new RewardsInfoType([], []);

  const rewardsContract = PoolRewardsContract.bind(rewardContractAddress);
  const rewardRate = utils.readValue<BigInt>(
    rewardsContract.try_rewardRate(),
    constants.BIGINT_ZERO
  );

  return new RewardsInfoType([rewardToken], [rewardRate]);
}

export function getRewardsData_v3(
  gaugeAddress: Address,
  block: ethereum.Block
): RewardsInfoType {
  const rewardRates: BigInt[] = [];
  const rewardTokens: Address[] = [];

  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);

  for (let idx = 0; idx < 5; idx++) {
    const rewardToken = utils.readValue<Address>(
      gaugeContract.try_reward_tokens(BigInt.fromI32(idx)),
      constants.NULL.TYPE_ADDRESS
    );

    if (rewardToken.equals(constants.NULL.TYPE_ADDRESS)) {
      return new RewardsInfoType(rewardTokens, rewardRates);
    }

    rewardTokens.push(rewardToken);

    const rewardRateCall = gaugeContract.try_reward_data(rewardToken);
    if (!rewardRateCall.reverted) {
      const rewardRate = rewardRateCall.value.getRate();

      if (rewardRateCall.value.getPeriod_finish().lt(block.timestamp)) {
        rewardRates.push(constants.BIGINT_ZERO);
      } else {
        rewardRates.push(rewardRate);
      }
    } else {
      const rewardRate1Call = gaugeContract.try_reward_data1(rewardToken);

      if (!rewardRate1Call.reverted) {
        const rewardRate = rewardRate1Call.value.rate;

        if (rewardRate1Call.value.period_finish.lt(block.timestamp)) {
          rewardRates.push(constants.BIGINT_ZERO);
        } else {
          rewardRates.push(rewardRate);
        }
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

  const gaugeTotalSupply = utils.readValue<BigInt>(
    gaugeContract.try_totalSupply(),
    constants.BIGINT_ZERO
  );

  pool.stakedOutputTokenAmount = gaugeTotalSupply;

  if (utils.equalsIgnoreCase(dataSource.network(), constants.Network.MAINNET)) {
    const gaugeWorkingSupply = utils.readValue<BigInt>(
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
  const gaugeContract = LiquidityGaugeContract.bind(gaugeAddress);
  const gaugeControllerContract = GaugeControllereContract.bind(
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
    const lastRequest = utils.readValue<BigInt>(
      gaugeControllerContract.try_last_request(gaugeAddress),
      constants.BIGINT_ZERO
    );
    const weekNumber = lastRequest.div(constants.NUMBER_OF_WEEKS_DENOMINATOR);

    inflationRate = utils
      .readValue<BigInt>(
        gaugeContract.try_inflation_rate1(weekNumber),
        constants.BIGINT_ZERO
      )
      .toBigDecimal();

    gaugeRelativeWeight = constants.BIGDECIMAL_POINT_FOUR;
  }

  // Get the rewards per day for this gauge
  const protocolTokenRewardEmissionsPerDay = inflationRate
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
  let rewardsInfo = getRewardsData_v1(gaugeAddress, block);

  if (rewardsInfo.isEmpty()) {
    rewardsInfo = getRewardsData_v2(gaugeAddress);
  }

  if (rewardsInfo.isEmpty()) {
    rewardsInfo = getRewardsData_v3(gaugeAddress, block);
  }

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
  const rewardToken = getOrCreateRewardToken(rewardTokenAddress, block);

  if (!pool.rewardTokens) {
    pool.rewardTokens = [];
  }
  const rewardTokens = pool.rewardTokens!;

  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
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

  const token = getOrCreateToken(rewardTokenAddress, block);
  const tokenPrice = getUsdPricePerToken(rewardTokenAddress);

  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardTokenPerDay;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardTokenPerDay
    .divDecimal(constants.BIGINT_TEN.pow(token.decimals as u8).toBigDecimal())
    .times(tokenPrice.usdPrice.div(tokenPrice.decimalsBaseTen));

  pool.rewardTokens = rewardTokens;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;

  utils.sortRewardTokens(pool);
  pool.save();
}

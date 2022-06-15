import { Address, BigInt, dataSource, log } from "@graphprotocol/graph-ts/index";
import { LiquidityPool } from "../../generated/schema";
import { CURVE_TOKEN, GAUGE_CONTROLLER } from "../common/constants/index";
import { getPoolFromGauge, getLiquidityPool, getRewardtoken } from "../common/getters";
import { getTokenPriceSnapshot } from "./snapshots";
import { Deposit, Withdraw } from "../../generated/templates/CurveGauge/Gauge";
import { DEFAULT_DECIMALS, Network, SECONDS_PER_DAY, ZERO_ADDRESS } from "../common/constants";
import { GaugeController } from "../../generated/templates/CurveGauge/GaugeController";
import { bigIntToBigDecimal, exponentToBigInt } from "../common/utils/numbers";
import { getCrvInflationRate, getCrvInflationRateUSD } from "./gauges/helpers";
import { CurveRewards } from "../../generated/templates/CurveGauge/CurveRewards";
import { GaugeV3 } from "../../generated/templates/CurveGauge/GaugeV3";

export function handleDeposit(event: Deposit): void {
  let poolId = getPoolFromGauge(event.address);
  let pool = getLiquidityPool(poolId);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.plus(event.params.value);
  pool.save();
  handleRewards(pool, event.block.number, event.block.timestamp);
}

export function handleWithdraw(event: Withdraw): void {
  let poolId = getPoolFromGauge(event.address);
  let pool = getLiquidityPool(poolId);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.minus(event.params.value);
  pool.save();
  handleRewards(pool, event.block.number, event.block.timestamp);
}

export function handleRewards(pool: LiquidityPool, blockNumber: BigInt, timestamp: BigInt): void {
  for (let i = 0; i < pool.rewardTokens.length; i++) {
    let rewardTokenId = pool.rewardTokens[i];
    let rewardToken = getRewardtoken(rewardTokenId);
    if (Address.fromString(rewardToken.token) == CURVE_TOKEN) {
      calculateGaugeV1Emissions(pool, blockNumber, timestamp, i);
    } else if (pool.rewardContract) {
      calculateGaugeV2Emissions(pool, timestamp, i);
    } else if (!pool.rewardContract && pool.rewardTokens.length > 1) {
      calculateGaugeV3Emissions(pool, timestamp, i);
    }
  }
}

export function calculateGaugeV1Emissions(
  pool: LiquidityPool,
  blockNumber: BigInt,
  timestamp: BigInt, // @ts-ignore
  rewardTokenIndex: i32,
): void {
  if (dataSource.network() != Network.MAINNET.toLowerCase()) {
    return;
  }
  if (pool.gauge == ZERO_ADDRESS) {
    return;
  }
  const gaugeController = GaugeController.bind(GAUGE_CONTROLLER);
  let relativeWeightCall = gaugeController.try_gauge_relative_weight(Address.fromString(pool.gauge));
  if (!relativeWeightCall.reverted) {
    let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    let tokensEmitted = getCrvInflationRate(timestamp);
    const emissionsRate = tokensEmitted.times(relativeWeightCall.value).div(exponentToBigInt(DEFAULT_DECIMALS));
    const inflationRateUSD = getCrvInflationRateUSD(tokensEmitted, blockNumber, timestamp);
    rewardTokenEmissionsAmount[rewardTokenIndex] = emissionsRate;
    rewardTokenEmissionsUSD[rewardTokenIndex] = inflationRateUSD;
    pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
    pool.save();
  } else {
    log.error("Failed to get gauge relative weight for pool {}", [pool.id]);
  }
}

// @ts-ignore
export function calculateGaugeV2Emissions(pool: LiquidityPool, timestamp: BigInt, rewardTokenIndex: i32): void {
  // pools of SNX rewards contract type only have one reward token (on top of CRV reward token)
  if (!pool.rewardContract) {
    return;
  }
  const curveRewards = CurveRewards.bind(Address.fromString(pool.rewardContract!));
  let emissionRateCall = curveRewards.try_rewardRate();
  if (!emissionRateCall.reverted) {
    let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    if (pool.rewardTokens.length > 1) {
      const rewardToken = getRewardtoken(pool.rewardTokens[rewardTokenIndex]);
      const rewardTokenPrice = getTokenPriceSnapshot(Address.fromString(rewardToken.token), timestamp, false);
      const emissionRate = emissionRateCall.value.times(BigInt.fromI32(SECONDS_PER_DAY));
      const emissionRateUSD = bigIntToBigDecimal(emissionRate, DEFAULT_DECIMALS).times(rewardTokenPrice);
      rewardTokenEmissionsAmount[rewardTokenIndex] = emissionRate;
      rewardTokenEmissionsUSD[rewardTokenIndex] = emissionRateUSD;
      pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
      pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
      pool.save();
    }
  }
}

// @ts-ignore
export function calculateGaugeV3Emissions(pool: LiquidityPool, timestamp: BigInt, rewardTokenIndex: i32): void {
  // if there is no reward contract, but the pool has more than one reward token (with the first being the CRV reward token),
  // then we can insinuate that the pool is v3 type
  let gaugeV3 = GaugeV3.bind(Address.fromString(pool.gauge));
  let rewardToken = getRewardtoken(pool.rewardTokens[rewardTokenIndex]);
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  let rewardDataCall = gaugeV3.try_reward_data(Address.fromString(rewardToken.token));
  if (!rewardDataCall.reverted) {
    let rewardTokenPrice = getTokenPriceSnapshot(Address.fromString(rewardToken.token), timestamp, false);
    const emissionRate = rewardDataCall.value.value3.times(BigInt.fromI32(SECONDS_PER_DAY));
    const emissionRateUSD = bigIntToBigDecimal(emissionRate, DEFAULT_DECIMALS).times(rewardTokenPrice);
    rewardTokenEmissionsAmount[rewardTokenIndex] = emissionRate;
    rewardTokenEmissionsUSD[rewardTokenIndex] = emissionRateUSD;
    pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
    pool.save();
  }
}

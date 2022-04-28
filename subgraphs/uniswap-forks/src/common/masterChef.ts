import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../config/_networkConfig";
import { MasterChef } from "../../generated/MasterChef/MasterChef";
import { MasterChefV2 } from "../../generated/MasterChef/MasterChefV2";
import { LiquidityPool } from "../../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO, INT_ZERO, UsageType, ZERO_ADDRESS } from "./constants";
import { getOrCreateToken } from "./getters";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "./price/price";
import { getRewardsPerDay } from "./rewards";

export function handleRewardV2(event: ethereum.Event, pid: BigInt, amount: BigInt, usageType: string): void {
  let poolContract = MasterChefV2.bind(event.address);

  let lpTokenAddress = ZERO_ADDRESS;
  let getlpAddress = poolContract.try_lpToken(pid);
  if (!getlpAddress.reverted) {
    lpTokenAddress = getlpAddress.value.toHexString();
  }

  let pool = LiquidityPool.load(lpTokenAddress);
  if (!pool) {
    return;
  }

  let getRewardTokenPerSecond = poolContract.try_bananaPerSecond();
  let rewardTokenPerSecond: BigInt = BIGINT_ZERO;
  if (!getRewardTokenPerSecond.reverted) {
    rewardTokenPerSecond = getRewardTokenPerSecond.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }

  let getPoolInfo = poolContract.try_poolInfo(pid);
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardTime: BigInt = BIGINT_ZERO;
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    poolAllocPoint = poolInfo.value2;
    lastRewardTime = poolInfo.value1;
  }

  // Calculate Reward Emission per sec
  let time = event.block.timestamp.minus(lastRewardTime);
  let rewardTokenRate = time
    .times(rewardTokenPerSecond)
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.REWARD_INTERVAL_TYPE);

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  log.warning("hello", []);
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

export function handleReward(event: ethereum.Event, pid: BigInt, amount: BigInt, usageType: string): void {
  let poolContract = MasterChef.bind(event.address);
  let getPoolInfo = poolContract.try_getPoolInfo(pid);

  let lpTokenAddress = ZERO_ADDRESS;
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardBlock: BigInt = BIGINT_ZERO;
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    lpTokenAddress = poolInfo.value0.toHexString();
    poolAllocPoint = poolInfo.value1;
    lastRewardBlock = poolInfo.value2;
  }

  let pool = LiquidityPool.load(lpTokenAddress);
  if (!pool) {
    return;
  }

  let getRewardTokenPerBlock = poolContract.try_cakePerBlock();
  let rewardTokenPerBlock: BigInt = BIGINT_ZERO;
  if (!getRewardTokenPerBlock.reverted) {
    rewardTokenPerBlock = getRewardTokenPerBlock.value;
  }

  let getMultiplier = poolContract.try_getMultiplier(lastRewardBlock, event.block.number);

  let multiplier: BigInt = BIGINT_ONE;
  if (!getMultiplier.reverted) {
    multiplier = getMultiplier.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }

  log.warning("HELLO", []);
  log.warning("multiplier: " + multiplier.toString(), []);
  log.warning("rewardTokenPerBlock: " + rewardTokenPerBlock.toString(), []);
  log.warning("poolAllocPoint: " + poolAllocPoint.toString(), []);
  log.warning("totalAllocPoint: " + totalAllocPoint.toString(), []);

  // Calculate Reward Emission per Block
  let rewardTokenRate = multiplier
    .times(rewardTokenPerBlock)
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.REWARD_INTERVAL_TYPE);

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  rewardToken.save();
  nativeToken.save();
  pool.save();
}

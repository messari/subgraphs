import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../config/configure";
import { MiniChefSushiswap } from "../../../../generated/MiniChef/MiniChefSushiswap";
import { LiquidityPool, _HelperStore } from "../../../../generated/schema";
import { BIGINT_FIVE, BIGINT_ZERO, INT_ZERO, UsageType, ZERO_ADDRESS } from "../../constants";
import { getOrCreateToken } from "../../getters";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "../../price/price";
import { getRewardsPerDay } from "../../rewards";

export function handleRewardMini(event: ethereum.Event, pid: BigInt, amount: BigInt, usageType: string): void {
  let masterChefPool = _HelperStore.load(pid.toString());
  let poolContract = MiniChefSushiswap.bind(event.address);

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _HelperStore(pid.toString());
    let getlpAddress = poolContract.try_lpToken(pid);
    let lpTokenAddress = ZERO_ADDRESS;
    if (!getlpAddress.reverted) {
      lpTokenAddress = getlpAddress.value.toHexString();
    }
    masterChefPool.valueString = lpTokenAddress;
    masterChefPool.valueBigInt = BIGINT_ZERO;
    masterChefPool.save();
  }

  // Return if pool does not exist - Banana tokens?
  let pool = LiquidityPool.load(masterChefPool.valueString!);
  if (!pool) {
    return;
  }

  // Update staked amounts
  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  // Return if you have calculated rewards recently
  if (event.block.number.minus(masterChefPool.valueBigInt!).lt(BIGINT_FIVE)) {
    pool.save();
    return;
  }

  // Get necessary values from the master chef contract to calculate rewards
  let getRewardTokenPerSecond = poolContract.try_sushiPerSecond();
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
  // let time = event.block.timestamp.minus(lastRewardTime);
  let rewardTokenRate = rewardTokenPerSecond.times(poolAllocPoint).div(totalAllocPoint);

  // Get the estimated rewards emitted for the upcoming day for this pool
  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.getRewardIntervalType());

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.truncate(0).toString())];

  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  masterChefPool.valueBigInt = event.block.number;

  masterChefPool.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

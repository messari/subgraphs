import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../configurations/configure";
import { HoneyFarm } from "../../../../generated/HoneyFarm/HoneyFarm";
import { BIGINT_ZERO, INT_ZERO, UsageType } from "../../../../src/common/constants";
import { getLiquidityPool, getOrCreateToken } from "../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../src/common/rewards";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "../../../../src/price/price";

export function handleReward(event: ethereum.Event, tokenId: BigInt, usageType: string): void {
  let poolContract = HoneyFarm.bind(event.address);
  let getDepositInfo = poolContract.try_depositInfo(tokenId);
  let lpTokenAddress = Address.zero();
  let amount = BIGINT_ZERO;
  if (!getDepositInfo.reverted) {
    let depositInfo = getDepositInfo.value;
    lpTokenAddress = depositInfo.value5;
    amount = depositInfo.value0;
  }

  // Return if pool does not exist
  let pool = getLiquidityPool(lpTokenAddress.toHexString());
  if (!pool) {
    return;
  }

  // Update staked amounts
  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  // Get necessary values from the HoneyFarm contract to calculate rewards
  let getPoolInfo = poolContract.try_poolInfo(lpTokenAddress);
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardTime: BigInt = BIGINT_ZERO;
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    poolAllocPoint = poolInfo.value1;
    lastRewardTime = poolInfo.value2;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocationPoints();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }

  let getDistribution = poolContract.try_getDistribution(lastRewardTime, event.block.timestamp);
  let distribution: BigInt = BIGINT_ZERO;
  if (!getDistribution.reverted) {
    distribution = getDistribution.value;
  }

  // Calculate Reward Emission
  let rewardTokenRate = distribution.times(poolAllocPoint).div(totalAllocPoint);
  
  // Get the estimated rewards emitted for the upcoming day for this pool
  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.getRewardIntervalType());

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(pool.rewardTokens![INT_ZERO]);
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.truncate(0).toString())];

  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  rewardToken.save();
  nativeToken.save();
  pool.save();
}

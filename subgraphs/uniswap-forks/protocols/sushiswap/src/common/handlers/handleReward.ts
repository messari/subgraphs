import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefSushiswap } from "../../../../../generated/MasterChef/MasterChefSushiswap";
import { LiquidityPool, _HelperStore, _MasterChef } from "../../../../../generated/schema";
import { RECENT_BLOCK_THRESHOLD, UsageType } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "../../../../../src/price/price";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef, getOrCreateMasterChefStakingPool } from "../helpers";
import { MasterChef } from "../constants";

export function handleReward(event: ethereum.Event, pid: BigInt, amount: BigInt, usageType: string): void {
  let poolContract = MasterChefSushiswap.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(event, MasterChef.MASTERCHEF, pid, poolContract)
  let masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF)

  let pool = LiquidityPool.load(masterChefPool.poolAddress);
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
  if (event.block.number.minus(masterChefPool.lastRewardBlock).lt(RECENT_BLOCK_THRESHOLD)) {
    pool.save();
    return;
  }

  // Get necessary values from the master chef contract to calculate rewards
  let poolInfo = poolContract.poolInfo(pid);
  masterChefPool.poolAllocPoint = poolInfo.value1;

  // Mutliplier including block mulitplier
  let fullMultiplier = poolContract.getMultiplier(masterChefPool.lastRewardBlock, event.block.number).div(masterChefPool.lastRewardBlock.minus(event.block.number))
  
  // Divide out the block multiplier so only the bonus multiplier is left
  masterChefPool.multiplier = fullMultiplier.div(masterChefPool.lastRewardBlock.minus(event.block.number))
  masterChef.totalAllocPoint = poolContract.totalAllocPoint();

  // Address where allocation is moved to over time to reduce inflation
  let masterPoolAllocPID45 = poolContract.poolInfo(BigInt.fromI32(45)).value1

  // Allocation from the MasterChefV2 Contract
  let masterPoolAllocPID250 = poolContract.poolInfo(BigInt.fromI32(250)).value1

  // Total allocation to staking pools that are giving out rewards to users
  let usedTotalAllocation = (masterChef.totalAllocPoint.minus(masterPoolAllocPID45).minus(masterPoolAllocPID250))

  // Actual total sushi given out per block to users
  masterChef.adjustedRewardTokenRate = (usedTotalAllocation.div(masterChef.totalAllocPoint)).times(masterChef.rewardTokenRate)
  masterChef.lastUpdatedRewardRate = event.block.number

  // Calculate Reward Emission per Block 
  let poolRewardTokenRate = masterChef.adjustedRewardTokenRate
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  let poolRewardTokenRateBigDecimal = BigDecimal.fromString(poolRewardTokenRate.toString());
  let poolRewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, poolRewardTokenRateBigDecimal, masterChef.rewardTokenInterval);

  let nativeToken = updateNativeTokenPriceInUSD();

  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.rewardTokenEmissionsAmount = [BigInt.fromString(poolRewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [poolRewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  masterChef.save()
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

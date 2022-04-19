import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../config/_networkConfig";
import { MasterChef } from "../../generated/MasterChef/MasterChef";
import { MasterChefV2 } from "../../generated/MasterChef/MasterChefV2";
import {
  BIGINT_ZERO,
  ZERO_ADDRESS,
} from "./constants";
import { getLiquidityPool, getOrCreateEtherHelper, getOrCreateTokenTracker } from "./getters";
import { findEthPerToken, getEthPriceInUSD } from "./price/price";
import { getRewardsPerDay } from "./rewards";

export function handleRewardV2(event: ethereum.Event, pid: BigInt): void {
  let pool = getLiquidityPool(event.address)
  
  let poolContract = MasterChefV2.bind(event.address);

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

  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString())
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.REWARD_INTERVAL_TYPE)

  let rewardTokenTracker = getOrCreateTokenTracker(pool.rewardTokens![0]);
  rewardTokenTracker.derivedETH = findEthPerToken(rewardTokenTracker);

  let ether = getOrCreateEtherHelper()
  ether.valueDecimal = getEthPriceInUSD()

  pool.currentRewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())]
  pool.currentRewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardTokenTracker.derivedETH).times(ether.valueDecimal!)]

  rewardTokenTracker.save()
  ether.save()
  pool.save()
}

export function handleReward(event: ethereum.Event, pid: BigInt): void {
  let pool = getLiquidityPool(event.address)
  
  let poolContract = MasterChef.bind(event.address);
  let getPoolInfo = poolContract.try_getPoolInfo(pid);
  let lpTokenAddress = ZERO_ADDRESS;
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardBlock: BigInt = BIGINT_ZERO;
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    lpTokenAddress = poolInfo.value0;
    poolAllocPoint = poolInfo.value1;
    lastRewardBlock = poolInfo.value2;
  }

  let getRewardTokenPerBlock = poolContract.try_cakePerBlock();
  let rewardTokenPerBlock: BigInt = BIGINT_ZERO;
  if (!getRewardTokenPerBlock.reverted){
    rewardTokenPerBlock = getRewardTokenPerBlock.value;
  }
    
  let getMultiplier = poolContract.try_getMultiplier(
    lastRewardBlock,
    event.block.number,
  );
  
  let multiplier: BigInt = BIGINT_ZERO;
  if (!getMultiplier.reverted) {
    multiplier = getMultiplier.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  } 

  // Calculate Reward Emission per Block
  let rewardTokenRate = multiplier
    .times(rewardTokenPerBlock)
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  let rewardTokenRateBigDecimal = BigDecimal.fromString(rewardTokenRate.toString())
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardTokenRateBigDecimal, NetworkConfigs.REWARD_INTERVAL_TYPE)
  
  let rewardTokenTracker = getOrCreateTokenTracker(pool.rewardTokens![0]);
  rewardTokenTracker.derivedETH = findEthPerToken(rewardTokenTracker);
  
  let ether = getOrCreateEtherHelper()
  ether.valueDecimal = getEthPriceInUSD()
  
  pool.currentRewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())]
  pool.currentRewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardTokenTracker.derivedETH).times(ether.valueDecimal!)]
  
  rewardTokenTracker.save()
  ether.save()
  pool.save()
}

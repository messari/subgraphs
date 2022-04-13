import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { MasterChef } from "../../generated/MasterChef/MasterChef";
import { MasterChefV2 } from "../../generated/MasterChef/MasterChefV2";
import {
  BIGINT_ZERO,
  BSC_SECONDS_PER_BLOCK,
  SECONDS_PER_DAY,
  ZERO_ADDRESS,
} from "../utils/constant";
import { updateLpWithReward } from "./pool";

export function handleRewardV2(event: ethereum.Event, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let rewardTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let rewardTokenPerSecond: BigInt = BIGINT_ZERO;
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardTime: BigInt = BIGINT_ZERO;

  let poolContract = MasterChefV2.bind(event.address);
  let getlpAddress = poolContract.try_lpToken(pid);
  if (!getlpAddress.reverted) {
    lpTokenAddress = getlpAddress.value;
  }
  let getRewardTokenPerSecond = poolContract.try_bananaPerSecond();
  if (!getRewardTokenPerSecond.reverted) {
    rewardTokenPerSecond = getRewardTokenPerSecond.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    poolAllocPoint = poolInfo.value2;
    lastRewardTime = poolInfo.value1;
  }

  let getRewardToken = poolContract.try_BANANA();
  if (!getRewardToken.reverted) {
    rewardTokenAddress = getRewardToken.value;
  } 

  // Calculate Reward Emission per sec
  let time = event.block.timestamp.minus(lastRewardTime);
  let rewardEmissionPerSec = time
    .times(rewardTokenPerSecond)
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  // Reward Emission Per Day
  let rewardEmissionPerDay = rewardEmissionPerSec.times(
    BigInt.fromI32(SECONDS_PER_DAY),
  );

  updateLpWithReward(lpTokenAddress, rewardTokenAddress, rewardEmissionPerDay);
}

export function handleReward(event: ethereum.Event, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let rewardTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  let poolAllocPoint: BigInt = BIGINT_ZERO;
  let lastRewardBlock: BigInt = BIGINT_ZERO;
  let rewardTokenPerBlock: BigInt = BIGINT_ZERO;
  let multiplier: BigInt = BIGINT_ZERO;

  let poolContract = MasterChef.bind(event.address);
  let getPoolInfo = poolContract.try_getPoolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    lpTokenAddress = poolInfo.value0;
    poolAllocPoint = poolInfo.value1;
    lastRewardBlock = poolInfo.value2;
  }
  let getRewardToken = poolContract.try_cake();
  if (!getRewardToken.reverted){
    rewardTokenAddress = getRewardToken.value;
  } 

  let getRewardTokenPerBlock = poolContract.try_cakePerBlock();
  if (!getRewardTokenPerBlock.reverted){
    rewardTokenPerBlock = getRewardTokenPerBlock.value;
  }
    
  let getMultiplier = poolContract.try_getMultiplier(
    lastRewardBlock,
    event.block.number,
  );
  if (!getMultiplier.reverted) {
    multiplier = getMultiplier.value;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  } 

  // Calculate Reward Emission per Block
  let rewardToken = multiplier
    .times(rewardTokenPerBlock)
    .times(poolAllocPoint)
    .div(totalAllocPoint);

  // Calculate Reward emission per day
  // A block is estimated to be produced approximately every 5secs
  let rewardTokenPerSecond = rewardToken.div(BSC_SECONDS_PER_BLOCK);
  let rewardTokenPerDay = rewardTokenPerSecond.times(
    BigInt.fromI32(SECONDS_PER_DAY),
  );
  updateLpWithReward(lpTokenAddress, rewardTokenAddress, rewardTokenPerDay);
}

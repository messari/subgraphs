import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Yield } from "../../generated/Yield/Yield";
import { YieldV2 } from "../../generated/Yield/YieldV2";
import { BIGINT_ZERO, BSC_SECONDS_PER_BLOCK, SECONDS_PER_DAY, ZERO_ADDRESS } from "../utils/constant";
import { updateLpWithReward } from "./pool";

export function handleRewardV2(call: ethereum.Call, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let bananaAddress: Address = Address.fromString(ZERO_ADDRESS);
  let bananaPerSecond: BigInt = BIGINT_ZERO
  let totalAllocPoint: BigInt = BIGINT_ZERO
  let poolAllocPoint: BigInt = BIGINT_ZERO
  let lastRewardTime: BigInt = BIGINT_ZERO

  let poolContract = YieldV2.bind(call.transaction.from);
  let getlpAddress = poolContract.try_lpToken(pid);
  if (!getlpAddress.reverted) {
    lpTokenAddress = getlpAddress.value;
  }
  let getBananaPerSecond = poolContract.try_bananaPerSecond();
  if (!getBananaPerSecond.reverted) {
    bananaPerSecond = getBananaPerSecond.value;
  }
  
  let getTotalAllocPoint = poolContract.try_totalAllocPoint();
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    poolAllocPoint = poolInfo.value2;
    lastRewardTime = poolInfo.value1
  }

  let getBanana = poolContract.try_BANANA();
  if (!getBanana.reverted) bananaAddress = getBanana.value;

  // Calculate Reward(BANANA) Emission per sec
  let time = call.block.timestamp.minus(lastRewardTime)
  let bananaReward = time.times(bananaPerSecond).times(poolAllocPoint).div(totalAllocPoint)

  // Reward(BANANA) Emission Per Day
  let bananaRewardPerDay = bananaReward.times(BigInt.fromI32(SECONDS_PER_DAY))

  updateLpWithReward(lpTokenAddress, bananaAddress, bananaRewardPerDay);
}

export function handleReward(call: ethereum.Call, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let bananaAddress: Address = Address.fromString(ZERO_ADDRESS);
  let totalAllocPoint: BigInt = BIGINT_ZERO
  let poolAllocPoint: BigInt = BIGINT_ZERO
  let lastRewardTime: BigInt = BIGINT_ZERO
  let lastRewardBlock: BigInt = BIGINT_ZERO
  let bananaPerBlock: BigInt = BIGINT_ZERO
  let multiplier: BigInt = BIGINT_ZERO

  let poolContract = Yield.bind(call.transaction.from);
  let getPoolInfo = poolContract.try_getPoolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    lpTokenAddress = poolInfo.value0;
    poolAllocPoint = poolInfo.value1;
    lastRewardBlock = poolInfo.value2;
  }
  let getBanana = poolContract.try_cake();
  if (!getBanana.reverted) bananaAddress = getBanana.value;

  let getCakePerBlock = poolContract.try_cakePerBlock();
  if (!getCakePerBlock.reverted) bananaPerBlock = getCakePerBlock.value;

  let getMultiplier = poolContract.try_getMultiplier(lastRewardBlock, call.block.number)
  if(!getMultiplier.reverted) multiplier = getMultiplier.value
  
  let getTotalAllocPoint = poolContract.try_totalAllocPoint()
  if(!getTotalAllocPoint.reverted) totalAllocPoint = getTotalAllocPoint.value
  
  // Calculate Reward(BANANA) Emission per Block
  let bananaReward = multiplier.times(bananaPerBlock).times(poolAllocPoint).div(totalAllocPoint)
  
  // @TODO: Calculate Reward(BANANA) emission per day
  // A block is estimated to be produced approximately every 5secs
  let bananaRewardPerSecond = bananaReward.div(BSC_SECONDS_PER_BLOCK)
  let bananaRewardPerDay = bananaRewardPerSecond.times(BigInt.fromI32(SECONDS_PER_DAY))

  updateLpWithReward(lpTokenAddress, bananaAddress, bananaRewardPerDay);
}

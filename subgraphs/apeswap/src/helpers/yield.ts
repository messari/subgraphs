import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Yield } from "../../generated/Yield/Yield";
import { YieldV2 } from "../../generated/Yield/YieldV2";
import { BIGINT_ZERO, ZERO_ADDRESS } from "../utils/constant";
import { updateLpWithReward } from "./pool";

export function handleRewardV2(event: ethereum.Event, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let bananaAddress: Address = Address.fromString(ZERO_ADDRESS);
  let accumulatedBanana: BigInt = BIGINT_ZERO;

  let poolContract = YieldV2.bind(event.address);
  let getlpAddress = poolContract.try_lpToken(pid);
  if (!getlpAddress.reverted) {
    lpTokenAddress = getlpAddress.value;
  }
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    accumulatedBanana = poolInfo.value0;
  }
  let getBanana = poolContract.try_BANANA();
  if (!getBanana.reverted) bananaAddress = getBanana.value;

  updateLpWithReward(lpTokenAddress, bananaAddress, accumulatedBanana);
}

export function handleReward(event: ethereum.Event, pid: BigInt): void {
  let lpTokenAddress: Address = Address.fromString(ZERO_ADDRESS);
  let bananaAddress: Address = Address.fromString(ZERO_ADDRESS);
  let accumulatedBanana: BigInt = BIGINT_ZERO;

  let poolContract = Yield.bind(event.address);
  let getPoolInfo = poolContract.try_getPoolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    lpTokenAddress = poolInfo.value0;
    accumulatedBanana = poolInfo.value3;
  }
  let getBanana = poolContract.try_cake();
  if (!getBanana.reverted) bananaAddress = getBanana.value;

  updateLpWithReward(lpTokenAddress, bananaAddress, accumulatedBanana);
}

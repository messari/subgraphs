import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { LiquidityPool, _HelperStore, _MasterChefStakingPool } from "../../../../../generated/schema";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "../../../../../src/price/price";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../helpers";
import { MasterChef } from "../../../../../src/common/constants";

export function updateMasterChefDeposit(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(MasterChef.MASTERCHEFV2 + "-" + pid.toString())!;
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress);
  if (!pool) {
    return;
  }

  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate.times(masterChefV2Pool.poolAllocPoint).div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(rewardAmountPerInterval.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardAmountPerIntervalBigDecimal, masterChefV2.rewardTokenInterval);

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  masterChefV2Pool.lastRewardBlock = event.block.number;

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount)
  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  masterChefV2Pool.save()
  masterChefV2.save()
  rewardToken.save()
  nativeToken.save()
  pool.save()
}

export function updateMasterChefWithdraw(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(MasterChef.MASTERCHEFV2 + "-" + pid.toString())!;
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress);
  if (!pool) {
    return;
  }

  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate.times(masterChefV2Pool.poolAllocPoint).div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(rewardAmountPerInterval.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardAmountPerIntervalBigDecimal, masterChefV2.rewardTokenInterval);

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  masterChefV2Pool.lastRewardBlock = event.block.number;

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount)
  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [rewardTokenPerDay.times(rewardToken.lastPriceUSD!)];

  masterChefV2Pool.save()
  masterChefV2.save()
  rewardToken.save()
  nativeToken.save()
  pool.save()
}
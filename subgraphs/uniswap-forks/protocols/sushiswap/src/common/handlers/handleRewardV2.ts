import { ethereum, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV2Sushiswap } from "../../../../../generated/MasterChefV2/MasterChefV2Sushiswap";
import { LiquidityPool, _MasterChef, _MasterChefStakingPool } from "../../../../../generated/schema";
import { INT_ZERO } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { convertTokenToDecimal } from "../../../../../src/common/utils/utils";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "../../../../../src/price/price";
import { MasterChef } from "../constants";
import { getOrCreateMasterChef } from "../helpers";

export function updateMasterChefDeposit(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(MasterChef.MASTERCHEFV2 + "-" + pid.toString())!;
  let masterchefV2Contract = MasterChefV2Sushiswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress);
  if (!pool) {
    return;
  }

  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    masterChefV2.adjustedRewardTokenRate = masterchefV2Contract.sushiPerBlock()
    masterChefV2.lastUpdatedRewardRate = event.block.number
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);

  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate.times(masterChefV2Pool.poolAllocPoint).div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(rewardAmountPerInterval.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardAmountPerIntervalBigDecimal, masterChefV2.rewardTokenInterval);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount)
  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [convertTokenToDecimal(pool.rewardTokenEmissionsAmount![INT_ZERO], rewardToken.decimals).times(rewardToken.lastPriceUSD!)];

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save()
  masterChefV2.save()
  rewardToken.save()
  nativeToken.save()
  pool.save()
}

export function updateMasterChefWithdraw(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
  let masterChefV2Pool = _MasterChefStakingPool.load(MasterChef.MASTERCHEFV2 + "-" + pid.toString())!;
  let masterchefV2Contract = MasterChefV2Sushiswap.bind(event.address);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefV2Pool.poolAddress);
  if (!pool) {
    return;
  }

  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    masterChefV2.adjustedRewardTokenRate = masterchefV2Contract.sushiPerBlock()
    masterChefV2.lastUpdatedRewardRate = event.block.number
  }

  let nativeToken = updateNativeTokenPriceInUSD();
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  rewardToken.lastPriceUSD = findNativeTokenPerToken(rewardToken, nativeToken);
  
  let rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate.times(masterChefV2Pool.poolAllocPoint).div(masterChefV2.totalAllocPoint);
  let rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(rewardAmountPerInterval.toString());
  let rewardTokenPerDay = getRewardsPerDay(event.block.timestamp, event.block.number, rewardAmountPerIntervalBigDecimal, masterChefV2.rewardTokenInterval);

  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount)
  pool.rewardTokenEmissionsAmount = [BigInt.fromString(rewardTokenPerDay.toString())];
  pool.rewardTokenEmissionsUSD = [convertTokenToDecimal(pool.rewardTokenEmissionsAmount![INT_ZERO], rewardToken.decimals).times(rewardToken.lastPriceUSD!)];

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save()
  masterChefV2.save()
  rewardToken.save()
  nativeToken.save()
  pool.save()
}

// export function updateMasterChefHarvest(event: ethereum.Event, pid: BigInt, amount: BigInt): void {
//   let masterChefPool = _MasterChefStakingPool.load(pid.toString())!;
//   // Return if pool does not exist
//   let pool = LiquidityPool.load(masterChefPool.poolAddress);
//   if (!pool) {
//     return;
//   }
//   pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount)
// }

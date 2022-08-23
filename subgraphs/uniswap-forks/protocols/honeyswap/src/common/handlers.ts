import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../configurations/configure";
import { HoneyFarm } from "../../../../generated/HoneyFarm/HoneyFarm";
import { LiquidityPool, _HelperStore } from "../../../../generated/schema";
import { BIGINT_ZERO, UsageType } from "../../../../src/common/constants";
import { getRewardsPerDay } from "../../../../src/common/rewards";

// WIP: HoneyFarm reward handlers currently not used in Honeyswap subgraph deployment
// TODO: Fix reward emissions calculations (rewardTokenRate) and add token pricing
export function handleReward(
  event: ethereum.Event,
  tokenId: BigInt,
  usageType: string
): void {
  let poolContract = HoneyFarm.bind(event.address);
  let getDepositInfo = poolContract.try_depositInfo(tokenId);
  let lpTokenAddress = Address.zero();
  let amount = BIGINT_ZERO;
  if (!getDepositInfo.reverted) {
    let depositInfo = getDepositInfo.value;
    lpTokenAddress = depositInfo.value5;
    amount = depositInfo.value0;
  }

  log.debug("DEPOSIT INFO: lpTokenAddress: {}, amount: {}", [
    lpTokenAddress.toHexString(),
    amount.toString(),
  ]);

  // Return if pool does not exist
  let pool = LiquidityPool.load(lpTokenAddress.toHexString());
  if (!pool) {
    return;
  }

  let honeyFarmPool = _HelperStore.load(lpTokenAddress.toHexString());

  // Create entity to track last HoneyFarm pool updates
  if (!honeyFarmPool) {
    honeyFarmPool = new _HelperStore(lpTokenAddress.toHexString());
    honeyFarmPool.valueBigInt = event.block.timestamp;
    honeyFarmPool.save();
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
    poolAllocPoint = poolInfo.value0;
    lastRewardTime = poolInfo.value1;
  }

  let getTotalAllocPoint = poolContract.try_totalAllocationPoints();
  let totalAllocPoint: BigInt = BIGINT_ZERO;
  if (!getTotalAllocPoint.reverted) {
    totalAllocPoint = getTotalAllocPoint.value;
  }

  log.debug(
    "DIST INFO: prevRewardTime: {}, event.block.timestamp: {}, lastRwardTime: {}",
    [
      honeyFarmPool.valueBigInt!.toString(),
      event.block.timestamp.toString(),
      lastRewardTime.toString(),
    ]
  );

  let getDistribution = poolContract.try_getDistribution(
    honeyFarmPool.valueBigInt!,
    event.block.timestamp
  );
  let distribution: BigInt = BIGINT_ZERO;
  if (!getDistribution.reverted) {
    distribution = getDistribution.value;
  }

  log.debug(
    "POOL INFO: poolAllocPoint: {}, totalAllocPoint: {}, lastRewardTime: {}, timestamp: {}, distribution: {}",
    [
      poolAllocPoint.toString(),
      totalAllocPoint.toString(),
      lastRewardTime.toString(),
      event.block.timestamp.toString(),
      distribution.toString(),
    ]
  );

  // Calculate Reward Emission
  let rewardTokenRate = distribution.times(poolAllocPoint).div(totalAllocPoint);

  // Get the estimated rewards emitted for the upcoming day for this pool
  let rewardTokenRateBigDecimal = new BigDecimal(rewardTokenRate);
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardTokenRateBigDecimal,
    NetworkConfigs.getRewardIntervalType()
  );

  log.debug("REWARD CALC: rewardTokenRate: {}, rewardTokenPerDay: {}", [
    rewardTokenRate.toString(),
    rewardTokenPerDay.toString(),
  ]);

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(rewardTokenPerDay.truncate(0).toString()),
  ];

  honeyFarmPool.valueBigInt = event.block.timestamp;

  pool.save();
}

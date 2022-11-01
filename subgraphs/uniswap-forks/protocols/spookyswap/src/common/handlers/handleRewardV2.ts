import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefV2Spookyswap } from "../../../../../generated/MasterChefV2/MasterChefV2Spookyswap";
import {
  LiquidityPool,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import { INT_ZERO, MasterChef } from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";
import {
  getOrCreateMasterChef,
  getOrCreateMasterChefStakingPool,
} from "../../../../../src/common/masterchef/helpers";

// Updated Liquidity pool staked amount and emmissions on a deposit to the masterchef contract.
export function updateMasterChef(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let masterChefV2Pool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEFV2,
    pid
  );

  const masterchefV2Contract = MasterChefV2Spookyswap.bind(event.address);
  const masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

  // Sometimes the pool addition event is not emitted before the deposit/withdraw event. In this case, we need to add the pool and allocation to the masterchef entity.
  if (!masterChefV2Pool.poolAddress) {
    masterChefV2Pool = getPoolAddressAndAllocation(
      event,
      pid,
      masterChefV2Pool
    );
    masterChefV2.totalAllocPoint = masterChefV2.totalAllocPoint.plus(
      masterChefV2Pool.poolAllocPoint
    );
    masterChefV2Pool.save();
    masterChefV2.save();
  }

  // Return if pool does not exist
  const pool = LiquidityPool.load(masterChefV2Pool.poolAddress!);
  if (!pool) {
    return;
  }

  const rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [rewardToken.id];

  // Get the amount of reward tokens emitted per block at this point in time.
  if (masterChefV2.lastUpdatedRewardRate != event.block.number) {
    const getSpookyPerBlock = masterchefV2Contract.try_booPerSecond();
    if (!getSpookyPerBlock.reverted) {
      masterChefV2.adjustedRewardTokenRate = getSpookyPerBlock.value;
    }
    masterChefV2.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per second to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block.
  const rewardAmountPerInterval = masterChefV2.adjustedRewardTokenRate
    .times(masterChefV2Pool.poolAllocPoint)
    .div(masterChefV2.totalAllocPoint);
  const rewardAmountPerIntervalBigDecimal = BigDecimal.fromString(
    rewardAmountPerInterval.toString()
  );

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  const rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardAmountPerIntervalBigDecimal,
    masterChefV2.rewardTokenInterval
  );

  // Update the amount of staked tokens after withdraw
  // Positive for deposits, negative for withdraws
  pool.stakedOutputTokenAmount = !pool.stakedOutputTokenAmount
    ? amount
    : pool.stakedOutputTokenAmount!.plus(amount);
  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
  ];

  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefV2Pool.lastRewardBlock = event.block.number;

  masterChefV2Pool.save();
  masterChefV2.save();
  rewardToken.save();
  pool.save();
}

export function getPoolAddressAndAllocation(
  event: ethereum.Event,
  pid: BigInt,
  masterChefV2Pool: _MasterChefStakingPool
): _MasterChefStakingPool {
  const poolContract = MasterChefV2Spookyswap.bind(event.address);

  const poolAddress = poolContract.try_lpToken(pid);
  const poolInfo = poolContract.try_poolInfo(pid);
  if (!poolAddress.reverted) {
    masterChefV2Pool.poolAddress = poolAddress.value.toHexString();
  }
  if (!poolInfo.reverted) {
    masterChefV2Pool.poolAllocPoint = poolInfo.value.getAllocPoint();
  }
  if (!masterChefV2Pool.poolAddress) {
    log.critical(
      "poolInfo reverted: Could not find pool address for masterchef pool",
      []
    );
  }
  return masterChefV2Pool;
}

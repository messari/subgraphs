import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { Craftsman } from "../../../../../generated/Craftsman/Craftsman";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  MasterChef,
  RECENT_BLOCK_THRESHOLD,
  UsageType,
} from "../../../../../src/common/constants";
import { getOrCreateToken } from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import { getOrCreateMasterChef } from "../helpers";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";

// Called on both deposits and withdraws into the MasterApe/MasterChef pool.
// Tracks staked LP tokens, and estimates the emissions of LP tokens for the liquidity pool associated with the staked LP.
// Emissions are estimated using rewards.ts and are projected for a 24 hour period.
export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt,
  usageType: string
): void {
  let poolContract = Craftsman.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid,
    poolContract
  );
  let masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF);

  // Check if the liquidity pool address is available. Try to get it if not or return if the contract call was reverted
  if (!masterChefPool.poolAddress) {
    let getPoolInfo = poolContract.try_poolInfo(pid);
    if (!getPoolInfo.reverted) {
      masterChefPool.poolAddress = getPoolInfo.value.value0.toHexString();
    }
    masterChefPool.save();

    if (!masterChefPool.poolAddress) {
      log.warning(
        "poolInfo reverted: Could not find pool address for masterchef pool",
        []
      );
      return;
    }
  }

  // Return if pool does not exist
  let pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (!pool) {
    return;
  }

  // Update staked amounts
  if (usageType == UsageType.DEPOSIT) {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);
  } else {
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.minus(amount);
  }

  // Return if you have calculated rewards recently - Performance Boost
  if (
    event.block.number
      .minus(masterChefPool.lastRewardBlock)
      .lt(RECENT_BLOCK_THRESHOLD)
  ) {
    pool.save();
    return;
  }

  // Get necessary values from the master chef contract to calculate rewards
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    masterChefPool.poolAllocPoint = poolInfo.value1;
  }

  // Get the bonus multiplier if it is applicable
  let getMuliplier = poolContract.try_getMultiplier(
    event.block.number.minus(BIGINT_ONE),
    event.block.number
  );
  if (!getMuliplier.reverted) {
    masterChefPool.multiplier = getMuliplier.value;
  }

  // Get the total allocation for all pools
  let getTotalAlloc = poolContract.try_totalAllocPoint();
  if (!getTotalAlloc.reverted) {
    masterChef.totalAllocPoint = getTotalAlloc.value;
  }

  // Actual total VVS given out per block to users
  let getRewardTokenPerBlock = poolContract.try_vvsPerBlock();
  if (!getRewardTokenPerBlock.reverted) {
    masterChef.adjustedRewardTokenRate = getRewardTokenPerBlock.value;
    masterChef.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per Block to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block
  let poolRewardTokenRate = masterChef.adjustedRewardTokenRate
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());
  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let poolRewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);
  let poolRewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    poolRewardTokenRateBigDecimal,
    masterChef.rewardTokenInterval
  );

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(poolRewardTokenPerDay).toString()),
  ];
  pool.rewardTokenEmissionsUSD = [
    convertTokenToDecimal(
      pool.rewardTokenEmissionsAmount![INT_ZERO],
      rewardToken.decimals
    ).times(rewardToken.lastPriceUSD!),
  ];

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  masterChef.save();
  rewardToken.save();
  nativeToken.save();
  pool.save();
}

// Create a MasterChefStaking pool using the MasterChef pid for id.
function getOrCreateMasterChefStakingPool(
  event: ethereum.Event,
  masterChefType: string,
  pid: BigInt,
  poolContract: Craftsman
): _MasterChefStakingPool {
  let masterChefPool = _MasterChefStakingPool.load(
    masterChefType + "-" + pid.toString()
  );

  // Create entity to track masterchef pool mappings
  if (!masterChefPool) {
    masterChefPool = new _MasterChefStakingPool(
      masterChefType + "-" + pid.toString()
    );

    masterChefPool.multiplier = BIGINT_ONE;
    masterChefPool.poolAllocPoint = BIGINT_ZERO;
    masterChefPool.lastRewardBlock = event.block.number;
    log.warning("MASTERCHEF POOL CREATED: " + pid.toString(), []);

    masterChefPool.save();
  }

  return masterChefPool;
}

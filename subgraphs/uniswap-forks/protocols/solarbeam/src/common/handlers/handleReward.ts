import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefSolarbeam } from "../../../../../generated/MasterChef/MasterChefSolarbeam";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  BIGINT_ONE,
  INT_ZERO,
  MasterChef,
  RECENT_BLOCK_THRESHOLD,
} from "../../../../../src/common/constants";
import {
  getOrCreateRewardToken,
  getOrCreateToken,
} from "../../../../../src/common/getters";
import { getRewardsPerDay } from "../../../../../src/common/rewards";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";
import {
  getOrCreateMasterChef,
  getOrCreateMasterChefStakingPool,
} from "../../../../../src/common/masterchef/helpers";

// Called on both deposits and withdraws into the MasterApe/MasterChef pool.
// Tracks staked LP tokens, and estimates the emissions of LP tokens for the liquidity pool associated with the staked LP.
// Emissions are estimated using rewards.ts and are projected for a 24 hour period.
export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let poolContract = MasterChefSolarbeam.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid
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

  // If the pool comes back null just return
  let pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (!pool) {
    return;
  }

  let rewardToken = getOrCreateToken(NetworkConfigs.getRewardToken());
  pool.rewardTokens = [
    getOrCreateRewardToken(NetworkConfigs.getRewardToken()).id,
  ];

  // Update staked amounts
  // Positive for deposits, negative for withdraws
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount!.plus(amount);

  // Return if you have calculated rewards recently - Performance Boost
  if (
    event.block.number
      .minus(masterChefPool.lastRewardBlock)
      .lt(RECENT_BLOCK_THRESHOLD)
  ) {
    pool.save();
    return;
  }

  // Get the pool allocation point to get the fractional awards given to this pool.
  let getPoolInfo = poolContract.try_poolInfo(pid);
  if (!getPoolInfo.reverted) {
    let poolInfo = getPoolInfo.value;
    masterChefPool.poolAllocPoint = poolInfo.value1;
  }

  // Get the bonus multiplier if it is applicable.
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

  // Reward tokens emitted to all pools per block in aggregate
  let getRewardTokenPerBlock = poolContract.try_solarPerBlock();
  if (!getRewardTokenPerBlock.reverted) {
    masterChef.adjustedRewardTokenRate = getRewardTokenPerBlock.value;
    masterChef.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per Block to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block
  let poolRewardTokenRate = masterChefPool.multiplier
    .times(masterChef.adjustedRewardTokenRate)
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  let rewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);
  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    rewardTokenRateBigDecimal,
    masterChef.rewardTokenInterval
  );

  pool.rewardTokenEmissionsAmount = [
    BigInt.fromString(roundToWholeNumber(rewardTokenPerDay).toString()),
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
  pool.save();
}

import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefSushiswap } from "../../../../../generated/MasterChef/MasterChefSushiswap";
import {
  LiquidityPool,
  _HelperStore,
  _MasterChef,
  _MasterChefStakingPool,
} from "../../../../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
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
  getOrCreateMasterChef,
  getOrCreateMasterChefStakingPool,
} from "../../../../../src/common/masterchef/helpers";
import {
  convertTokenToDecimal,
  roundToWholeNumber,
} from "../../../../../src/common/utils/utils";

// Called on both deposits and withdraws into the MasterChef pool.
// Tracks staked LP tokens, and estimates the emissions of LP tokens for the liquidity pool associated with the staked LP.
// Emissions are estimated using rewards.ts and are projected for a 24 hour period.
export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let poolContract = MasterChefSushiswap.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid
  );
  let masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF);
  let masterChefV2 = getOrCreateMasterChef(event, MasterChef.MASTERCHEFV2);

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

  // If comes back null then it is probably a uniswap v2 pool.
  // MasterChef was used for UniV2 LP tokens before SushiSwap liquidity pools were created.
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
  pool.stakedOutputTokenAmount = !pool.stakedOutputTokenAmount
    ? amount
    : pool.stakedOutputTokenAmount!.plus(amount);

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

  // Allocation from the MasterChefV2 Contract.
  // This portion of the allocation is fed into the MasterChevV2 contract.
  // This means the proportion of rewards at this allocation will be all rewards emitted by MasterChefV2.
  let getPoolInfo250 = poolContract.try_poolInfo(BigInt.fromI32(250));
  let masterChefV2Alloc: BigInt;
  if (!getPoolInfo250.reverted) {
    masterChefV2Alloc = getPoolInfo250.value.value1;
  } else {
    masterChefV2Alloc = BIGINT_ZERO;
  }

  // Adjusted Reward Emission are just the static reward rate
  masterChef.adjustedRewardTokenRate = masterChef.rewardTokenRate;
  masterChef.lastUpdatedRewardRate = event.block.number;

  // Calculate Adjusted Reward Emission per Block to the MasterChefV2 Contract
  masterChefV2.adjustedRewardTokenRate = masterChefV2Alloc
    .div(masterChef.totalAllocPoint)
    .times(masterChef.rewardTokenRate);
  masterChefV2.lastUpdatedRewardRate = event.block.number;

  // Calculate Reward Emission per Block
  let poolRewardTokenRate = masterChefPool.multiplier
    .times(masterChef.adjustedRewardTokenRate)
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);
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
  masterChefV2.save();
  rewardToken.save();
  pool.save();
}

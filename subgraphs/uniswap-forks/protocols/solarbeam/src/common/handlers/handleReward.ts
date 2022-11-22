import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { SolarDistributorV2 } from "../../../../../generated/MasterChef/SolarDistributorV2";
import { LiquidityPool } from "../../../../../generated/schema";
import {
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
  const poolContract = SolarDistributorV2.bind(event.address);
  const masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid
  );
  const masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF);

  // Check if the liquidity pool address is available. Try to get it if not or return if the contract call was reverted
  if (!masterChefPool.poolAddress) {
    const getPoolInfo = poolContract.try_poolInfo(pid);
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
  const pool = LiquidityPool.load(masterChefPool.poolAddress!);
  if (!pool) {
    return;
  }

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

  // Get the reward tokens emitted per second for the pool. There can be multiple reward tokens per pool.
  const getPoolRewardsPerSecond = poolContract.try_poolRewardsPerSec(pid);
  const rewardTokenEmissionsAmountArray: BigInt[] = [];
  const rewardTokenEmissionsUSDArray: BigDecimal[] = [];
  const rewardTokenIds: string[] = [];
  if (!getPoolRewardsPerSecond.reverted) {
    // Value 0: Reward Token Address
    // Value 3: Reward Token Emissions Per Second
    for (
      let index = 0;
      index < getPoolRewardsPerSecond.value.value0.length;
      index++
    ) {
      const rewardTokenAddresses = getPoolRewardsPerSecond.value.value0;
      const rewardTokenEmissionsPerSecond =
        getPoolRewardsPerSecond.value.value3;

      rewardTokenIds.push(
        getOrCreateRewardToken(rewardTokenAddresses[index].toHexString()).id
      );
      const rewardToken = getOrCreateToken(
        rewardTokenAddresses[index].toHexString()
      );
      const rewardTokenRateBigDecimal =
        rewardTokenEmissionsPerSecond[index].toBigDecimal();

      // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
      const rewardTokenPerDay = getRewardsPerDay(
        event.block.timestamp,
        event.block.number,
        rewardTokenRateBigDecimal,
        masterChef.rewardTokenInterval
      );

      const rewardTokenPerDayRounded = BigInt.fromString(
        roundToWholeNumber(rewardTokenPerDay).toString()
      );
      const rewardTokenEmissionsUSD = convertTokenToDecimal(
        rewardTokenPerDayRounded,
        rewardToken.decimals
      ).times(rewardToken.lastPriceUSD!);

      rewardTokenEmissionsAmountArray.push(rewardTokenPerDayRounded);
      rewardTokenEmissionsUSDArray.push(rewardTokenEmissionsUSD);
    }
  }

  pool.rewardTokens = rewardTokenIds;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmountArray;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSDArray;

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  masterChef.save();
  pool.save();
}

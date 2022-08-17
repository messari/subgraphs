import { BigDecimal, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../../configurations/configure";
import { MasterChefBiswap } from "../../../../../generated/MasterChef/MasterChefBiswap";
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
import {
  getOrCreateDex,
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
import { getOrCreateMasterChefAlloc } from "../helpers";

// Called on both deposits and withdraws into the MasterApe/MasterChef pool.
// Tracks staked LP tokens, and estimates the emissions of LP tokens for the liquidity pool associated with the staked LP.
// Emissions are estimated using rewards.ts and are projected for a 24 hour period.
export function handleReward(
  event: ethereum.Event,
  pid: BigInt,
  amount: BigInt
): void {
  let poolContract = MasterChefBiswap.bind(event.address);
  let masterChefPool = getOrCreateMasterChefStakingPool(
    event,
    MasterChef.MASTERCHEF,
    pid
  );
  let masterChef = getOrCreateMasterChef(event, MasterChef.MASTERCHEF);
  let masterChefAlloc = getOrCreateMasterChefAlloc(MasterChef.MASTERCHEF);

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

  // Get the staking percentage of the total reward emissions.
  let getStakingPercent = poolContract.try_stakingPercent();
  let stakingPercent: BigInt = BIGINT_ZERO;
  if (!getStakingPercent.reverted) {
    stakingPercent = getStakingPercent.value;
    masterChefAlloc.stakingPercent = stakingPercent;
  }

  let getPercentDec = poolContract.try_percentDec();
  let percentDec: BigInt = BIGINT_ZERO;
  if (!getPercentDec.reverted) {
    percentDec = getPercentDec.value;
    masterChefAlloc.percentDec = percentDec;
  }

  if (masterChefAlloc.lastBlockDevWithdraw.equals(BIGINT_ZERO)) {
    let getStartBlock = poolContract.try_startBlock();
    let startBlock: BigInt = BIGINT_ZERO;
    if (!getStartBlock.reverted) {
      startBlock = getStartBlock.value;
      masterChefAlloc.lastBlockDevWithdraw = startBlock;
    }
  }

  let getLastBlockDevWithdraw = poolContract.try_lastBlockDevWithdraw();
  let lastBlockDevWithdraw: BigInt = BIGINT_ZERO;
  if (!getLastBlockDevWithdraw.reverted) {
    lastBlockDevWithdraw = getLastBlockDevWithdraw.value;
  }

  // Reward tokens emitted to all pools per block in aggregate
  let getRewardTokenPerBlock = poolContract.try_BSWPerBlock();
  if (!getRewardTokenPerBlock.reverted) {
    masterChef.adjustedRewardTokenRate = getRewardTokenPerBlock.value.times(stakingPercent).div(percentDec);
    masterChef.lastUpdatedRewardRate = event.block.number;
  }

  // Calculate Reward Emission per Block to a specific pool
  // Pools are allocated based on their fraction of the total allocation times the rewards emitted per block
  let poolRewardTokenRate = masterChefPool.multiplier
    .times(masterChef.adjustedRewardTokenRate)
    .times(masterChefPool.poolAllocPoint)
    .div(masterChef.totalAllocPoint);

  let poolRewardTokenRateBigDecimal = new BigDecimal(poolRewardTokenRate);

  // Based on the emissions rate for the pool, calculate the rewards per day for the pool.
  let rewardTokenPerDay = getRewardsPerDay(
    event.block.timestamp,
    event.block.number,
    poolRewardTokenRateBigDecimal,
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

  // Handling dev withdraw for devs, referrals and safu fund
  if (lastBlockDevWithdraw > masterChefAlloc.lastBlockDevWithdraw) {
    let protocolSidePercent = percentDec.minus(stakingPercent);
    let multiplier = lastBlockDevWithdraw.minus(masterChefAlloc.lastBlockDevWithdraw).times(protocolSidePercent).div(percentDec);
    let protocolSideRewardTokenAmount = getRewardTokenPerBlock.value.times(multiplier);
    let protocolSideRewardAmountUSD = convertTokenToDecimal(protocolSideRewardTokenAmount, rewardToken.decimals).times(rewardToken.lastPriceUSD!);

    log.info("[{}] protocolSideRewardTokenAmount: {} in blocks {} at bn", [event.transaction.hash.toHexString(), protocolSideRewardTokenAmount.toString(), multiplier.toString(), event.block.number.toString()]);
    log.info("[{}] protocolSideRewardAmountUSD: {} in blocks {} at bn", [event.transaction.hash.toHexString(), protocolSideRewardAmountUSD.toString(), multiplier.toString(), event.block.number.toString()]);

    masterChefAlloc.cumulativeProtocolSideAmountUSD = masterChefAlloc.cumulativeProtocolSideAmountUSD.plus(protocolSideRewardAmountUSD);
    masterChefAlloc.cumulativeProtocolSideTokenAmount = masterChefAlloc.cumulativeProtocolSideTokenAmount.plus(protocolSideRewardTokenAmount.toBigDecimal());
    masterChefAlloc.lastBlockDevWithdraw = lastBlockDevWithdraw;

    // Protocol revenue metrics
    let protocol = getOrCreateDex();
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolSideRewardAmountUSD);
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(protocolSideRewardAmountUSD);
    protocol.save();
  }

  masterChefPool.lastRewardBlock = event.block.number;

  masterChefPool.save();
  masterChefAlloc.save();
  masterChef.save();
  rewardToken.save();
  pool.save();
}

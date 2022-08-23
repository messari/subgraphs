import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw, EmergencyWithdraw, LpStaking__poolInfoResult } from "../../generated/LpStaking/LpStaking";
import {
  Deposit as DepositV2,
  Withdraw as WithdrawV2,
  EmergencyWithdraw as EmergencyWithdrawV2,
  LpStakingV2,
} from "../../generated/LpStakingV2/LpStakingV2";
import { LpStaking } from "../../generated/LpStaking/LpStaking";
import { BIGINT_ZERO, DEFAULT_DECIMALS, EPS_ADDRESS, EPX_ADDRESS, ZERO_ADDRESS } from "../common/constants";
import { getOrCreatePool, getOrCreateRewardToken, getPoolFromLpToken } from "../common/getters";
import { LiquidityPool } from "../../generated/schema";
import { getTokenPriceSnapshot } from "../services/snapshots";
import { bigIntToBigDecimal } from "../common/utils/numbers";

export function handleLpStaking(
  pool: LiquidityPool,
  poolInfo: LpStaking__poolInfoResult,
  lpstakingContract: LpStaking,
  timestamp: BigInt,
): void {
  const allocPoint = poolInfo.value2;
  const totalAllocPoint = lpstakingContract.totalAllocPoint();
  const rewardsPerSecond = allocPoint.times(lpstakingContract.rewardsPerSecond()).div(totalAllocPoint);
  const rewardTokenPriceUSD = getTokenPriceSnapshot(EPS_ADDRESS, timestamp);
  const rewardsPerSecondUSD = bigIntToBigDecimal(rewardsPerSecond,DEFAULT_DECIMALS).times(rewardTokenPriceUSD);
  const rewardToken = getOrCreateRewardToken(EPS_ADDRESS);
  let rewardTokens = pool.rewardTokens;
  if (!rewardTokens.includes(rewardToken.id)) {
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens;
  }
  const rewardTokenIndex = rewardTokens.indexOf(rewardToken.id);
  let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  rewardTokenEmissionsAmount[rewardTokenIndex] = rewardsPerSecond;
  rewardTokenEmissionsUSD[rewardTokenIndex] = rewardsPerSecondUSD;
  pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
  pool.rewardTokenEmissionsUSD = rewardTokenEmissionsUSD;
  pool.save();
}

export function handleDeposit(event: Deposit): void {
  if (event.params.pid == BIGINT_ZERO) {
    return; // pancake swap eps/wbnb pool2, not protocol pool
  }
  let lpstakingContract = LpStaking.bind(event.address);
  let poolId = event.params.pid;
  const poolInfoCall = lpstakingContract.try_poolInfo(poolId);
  if (!poolInfoCall.reverted) {
    const poolInfo = poolInfoCall.value;
    const lptoken = poolInfo.value0;
    let poolAddress = getPoolFromLpToken(lptoken);
    if (poolAddress == ZERO_ADDRESS) {
      log.error('pool address not found for lpToken: {}', [lptoken.toHexString()]);
      return;
    }
    let pool = getOrCreatePool(Address.fromString(poolAddress), event);
    handleLpStaking(pool, poolInfo, lpstakingContract, event.block.timestamp);
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.plus(event.params.amount);
    pool.save();
  }
}

export function handleWithdraw(event: Withdraw): void {
  if (event.params.pid == BIGINT_ZERO) {
    return; // pancake swap eps/wbnb pool2, not protocol pool
  }
  let lpstakingContract = LpStaking.bind(event.address);
  let poolId = event.params.pid;
  const poolInfoCall = lpstakingContract.try_poolInfo(poolId);
  if (!poolInfoCall.reverted) {
    const poolInfo = poolInfoCall.value;
    const lptoken = poolInfo.value0;
    let poolAddress = getPoolFromLpToken(lptoken);
    if (poolAddress == ZERO_ADDRESS) {
      log.error('pool address not found for lpToken: {}', [lptoken.toHexString()]);
      return;
    }
    let pool = getOrCreatePool(Address.fromString(poolAddress), event);
    handleLpStaking(pool, poolInfo, lpstakingContract, event.block.timestamp);
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.minus(event.params.amount);
    pool.save();
  }
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  if (event.params.pid == BIGINT_ZERO) {
    return; // pancake swap eps/wbnb pool2, not protocol pool
  }
  let lpstakingContract = LpStaking.bind(event.address);
  let poolId = event.params.pid;
  const poolInfoCall = lpstakingContract.try_poolInfo(poolId);
  if (!poolInfoCall.reverted) {
    const poolInfo = poolInfoCall.value;
    const lptoken = poolInfo.value0;
    let poolAddress = getPoolFromLpToken(lptoken);
    if (poolAddress == ZERO_ADDRESS) {
      log.error('pool address not found for lpToken: {}', [lptoken.toHexString()]);
      return;
    }
    let pool = getOrCreatePool(Address.fromString(poolAddress), event);
    handleLpStaking(pool, poolInfo, lpstakingContract, event.block.timestamp);
    pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.minus(event.params.amount);
    pool.save();
  }
}

export function handleLpStakingV2(
  stakingAddress: Address,
  lpToken: Address,
  pool: LiquidityPool,
  timestamp: BigInt,
): void {
  const poolInfoCall = LpStakingV2.bind(stakingAddress).try_poolInfo(lpToken);
  const rewardToken = getOrCreateRewardToken(EPS_ADDRESS);
  if (!pool.rewardTokens.includes(rewardToken.id)) {
    let rewardTokens = pool.rewardTokens;
    rewardTokens.push(rewardToken.id);
    pool.rewardTokens = rewardTokens.sort();
    pool.save();
  }
  if (!poolInfoCall.reverted) {
    const poolInfo = poolInfoCall.value;
    const rewardsPerSecond = poolInfo.value1;
    const rewardTokenPriceUSD = getTokenPriceSnapshot(EPX_ADDRESS, timestamp);
    const rewardsPerSecondUSD = bigIntToBigDecimal(rewardsPerSecond, DEFAULT_DECIMALS).times(rewardTokenPriceUSD);
    let rewardTokenIndex = pool.rewardTokens.indexOf(rewardToken.id);
    let rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
    let rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
    rewardTokenEmissionsAmount[rewardTokenIndex] = BigInt.fromString(rewardsPerSecond.toString());
    rewardTokenEmissionsUSD[rewardTokenIndex] = rewardsPerSecondUSD;
    pool.rewardTokenEmissionsAmount = rewardTokenEmissionsAmount;
    pool.save();
  }
}

export function handleDepositV2(event: DepositV2): void {
  let poolAddress = getPoolFromLpToken(event.params.token);
  if (poolAddress == ZERO_ADDRESS) {
    return;
  }
  const pool = getOrCreatePool(Address.fromString(poolAddress), event);
  handleLpStakingV2(event.address, event.params.token, pool, event.block.timestamp);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.plus(event.params.amount);
  pool.save();
}

export function handleWithdrawV2(event: WithdrawV2): void {
  let poolAddress = getPoolFromLpToken(event.params.token);
  if (poolAddress == ZERO_ADDRESS) {
    return;
  }
  const pool = getOrCreatePool(Address.fromString(poolAddress), event);
  handleLpStakingV2(event.address, event.params.token, pool, event.block.timestamp);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.minus(event.params.amount);
  pool.save();
}

export function handleEmergencyWithdrawV2(event: EmergencyWithdrawV2): void {
  let poolAddress = getPoolFromLpToken(event.params.token);
  if (poolAddress == ZERO_ADDRESS) {
    return;
  }
  const pool = getOrCreatePool(Address.fromString(poolAddress), event);
  handleLpStakingV2(event.address, event.params.token, pool, event.block.timestamp);
  pool.stakedOutputTokenAmount = pool.stakedOutputTokenAmount.minus(event.params.amount);
  pool.save();
}

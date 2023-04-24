import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  LiquidityPool,
  Option,
  Token,
  Withdraw,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_HUNDRED,
  BIGINT_ZERO,
  INT_ZERO,
  OptionType,
} from "../common/constants";
import { getOrCreateToken } from "../common/tokens";
import { getUSDAmount } from "../price";
import {
  addProtocolClosedVolume,
  addProtocolExercisedVolume,
  addProtocolMintVolume,
  decrementProtocolPositionCount,
  getOrCreateOpynProtocol,
  incrementProtocolExercisedCount,
  incrementProtocolMintedCount,
  incrementProtocolPositionCount,
  incrementProtocolTotalPoolCount,
  updateProtocolOpenInterest,
  updateProtocolUSDLocked,
} from "./protocol";

export function getOrCreatePool(token: Token): LiquidityPool {
  let pool = LiquidityPool.load(token.id);
  if (!pool) {
    pool = new LiquidityPool(token.id);
    pool.protocol = getOrCreateOpynProtocol().id;
    pool.name = token.name;
    pool.symbol = token.symbol;
    pool.inputTokens = [token.id];
    pool.outputToken = null;
    pool.rewardTokens = null;
    pool.fees = [];
    pool.oracle = null;
    pool.createdTimestamp = BIGINT_ZERO;
    pool.createdBlockNumber = BIGINT_ZERO;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    pool.cumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeDepositedVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeDepositedVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeDepositedVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    pool.cumulativeWithdrawVolumeByTokenAmount = [BIGINT_ZERO];
    pool.cumulativeExercisedVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;
    pool.openInterestUSD = BIGDECIMAL_ZERO;
    pool.putsMintedCount = INT_ZERO;
    pool.callsMintedCount = INT_ZERO;
    pool.contractsMintedCount = INT_ZERO;
    pool.contractsTakenCount = INT_ZERO;
    pool.contractsExpiredCount = INT_ZERO;
    pool.contractsExercisedCount = INT_ZERO;
    pool.contractsClosedCount = INT_ZERO;
    pool.openPositionCount = INT_ZERO;
    pool.closedPositionCount = INT_ZERO;
    pool.inputTokenBalances = [BIGINT_ZERO];
    pool.inputTokenWeights = [BIGINT_HUNDRED.toBigDecimal()];
    pool.outputTokenSupply = null;
    pool.outputTokenPriceUSD = null;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = null;
    pool.rewardTokenEmissionsUSD = null;
    pool._lastDailySnapshotTimestamp = BIGINT_ZERO;
    pool._lastHourlySnapshotTimestamp = BIGINT_ZERO;
    pool.save();
    incrementProtocolTotalPoolCount();
  }
  return pool;
}

export function handlePoolDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  deposit: Deposit
): void {
  const amount = deposit.inputTokenAmounts[0];
  pool.inputTokenBalances = [pool.inputTokenBalances[0].plus(amount)];
  pool.cumulativeDepositedVolumeUSD = pool.cumulativeDepositedVolumeUSD.plus(
    deposit.amountUSD
  );
  pool.cumulativeDepositedVolumeByTokenUSD = [
    pool.cumulativeDepositedVolumeByTokenUSD[0].plus(deposit.amountUSD),
  ];
  pool.cumulativeDepositedVolumeByTokenAmount = [
    pool.cumulativeDepositedVolumeByTokenAmount[0].plus(amount),
  ];
  pool.save();
  updatePoolTVL(event, pool);
}

export function handlePoolWithdraw(
  event: ethereum.Event,
  pool: LiquidityPool,
  withdraw: Withdraw
): void {
  const amount = withdraw.inputTokenAmounts[0];
  pool.inputTokenBalances = [pool.inputTokenBalances[0].minus(amount)];
  pool.cumulativeWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD.plus(
    withdraw.amountUSD
  );
  pool.cumulativeWithdrawVolumeByTokenUSD = [
    pool.cumulativeWithdrawVolumeByTokenUSD[0].plus(withdraw.amountUSD),
  ];
  pool.cumulativeWithdrawVolumeByTokenAmount = [
    pool.cumulativeWithdrawVolumeByTokenAmount[0].plus(amount),
  ];
  pool.save();
  updatePoolTVL(event, pool);
}

export function updatePoolTVL(
  event: ethereum.Event,
  pool: LiquidityPool
): void {
  const token = getOrCreateToken(pool.inputTokens[0]);
  const totalValueLocked = getUSDAmount(
    event,
    token,
    pool.inputTokenBalances[0]
  );
  updateProtocolUSDLocked(totalValueLocked.minus(pool.totalValueLockedUSD));
  pool.totalValueLockedUSD = totalValueLocked;
  pool.save();
}

export function updatePoolOpenInterest(
  event: ethereum.Event,
  pool: LiquidityPool,
  netChangeUSD: BigDecimal
): void {
  pool.openInterestUSD = pool.openInterestUSD.plus(netChangeUSD);
  pool.save();
  updateProtocolOpenInterest(netChangeUSD);
}

export function addPoolMintVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(amountUSD);
  pool.save();
  addProtocolMintVolume(amountUSD);
}

export function addPoolClosedVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeClosedVolumeUSD =
    pool.cumulativeClosedVolumeUSD.plus(amountUSD);
  pool.save();
  addProtocolClosedVolume(amountUSD);
}

export function addPoolExercisedVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeExercisedVolumeUSD =
    pool.cumulativeExercisedVolumeUSD.plus(amountUSD);
  pool.save();
  addProtocolExercisedVolume(amountUSD);
}

export function incrementPoolPositionCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.openPositionCount += 1;
  pool.contractsTakenCount += 1;
  pool.save();
  incrementProtocolPositionCount();
}

export function decrementPoolPositionCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.openPositionCount -= 1;
  pool.closedPositionCount += 1;
  pool.contractsClosedCount += 1;
  pool.save();
  decrementProtocolPositionCount();
}

export function incrementPoolMintedCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  if (option.type == OptionType.CALL) {
    pool.callsMintedCount += 1;
  } else {
    pool.putsMintedCount += 1;
  }
  pool.contractsMintedCount += 1;
  pool.save();
  incrementProtocolMintedCount(option);
}

export function incrementPoolExercisedCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.contractsExercisedCount += 1;
  pool.save();
  incrementProtocolExercisedCount();
}

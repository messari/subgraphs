import { BigDecimal, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  Option,
  Token,
  Withdraw,
} from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  OptionType,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
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
  incrementProtocolTakenCount,
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
    pool.cumulativeDepositVolumeUSD = BIGDECIMAL_ZERO;
    pool.cumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
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
    pool.inputTokenWeights = [BIGDECIMAL_ONE];
    pool.outputTokenSupply = null;
    pool.outputTokenPriceUSD = null;
    pool.stakedOutputTokenAmount = null;
    pool.rewardTokenEmissionsAmount = null;
    pool.rewardTokenEmissionsUSD = null;
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
  pool.cumulativeDepositVolumeUSD = pool.cumulativeDepositVolumeUSD.plus(
    deposit.amountUSD
  );
  pool.save();
  updatePoolTVL(event, pool);
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyDepositedVolumeByTokenAmount = [
    dailySnapshot.dailyDepositedVolumeByTokenAmount[0].plus(amount),
  ];
  dailySnapshot.dailyDepositedVolumeByTokenUSD = [
    dailySnapshot.dailyDepositedVolumeByTokenUSD[0].plus(deposit.amountUSD),
  ];
  dailySnapshot.dailyDepositedVolumeUSD =
    dailySnapshot.dailyDepositedVolumeUSD.plus(deposit.amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.hourlyDepositVolumeByTokenAmount = [
    hourlySnapshot.hourlyDepositVolumeByTokenAmount[0].plus(amount),
  ];
  hourlySnapshot.hourlyDepositVolumeByTokenUSD = [
    hourlySnapshot.hourlyDepositVolumeByTokenUSD[0].plus(deposit.amountUSD),
  ];
  hourlySnapshot.hourlyDepositVolumeUSD =
    hourlySnapshot.hourlyDepositVolumeUSD.plus(deposit.amountUSD);
  hourlySnapshot.save();
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
  pool.save();
  updatePoolTVL(event, pool);
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyWithdrawVolumeByTokenAmount = [
    dailySnapshot.dailyWithdrawVolumeByTokenAmount[0].plus(amount),
  ];
  dailySnapshot.dailyWithdrawVolumeByTokenUSD = [
    dailySnapshot.dailyWithdrawVolumeByTokenUSD[0].plus(withdraw.amountUSD),
  ];
  dailySnapshot.dailyWithdrawVolumeUSD =
    dailySnapshot.dailyWithdrawVolumeUSD.plus(withdraw.amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.hourlyWithdrawVolumeByTokenAmount = [
    hourlySnapshot.hourlyWithdrawVolumeByTokenAmount[0].plus(amount),
  ];
  hourlySnapshot.hourlyWithdrawVolumeByTokenUSD = [
    hourlySnapshot.hourlyWithdrawVolumeByTokenUSD[0].plus(withdraw.amountUSD),
  ];
  hourlySnapshot.hourlyWithdrawVolumeUSD =
    hourlySnapshot.hourlyWithdrawVolumeUSD.plus(withdraw.amountUSD);
  hourlySnapshot.save();
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
  updateProtocolUSDLocked(
    event,
    totalValueLocked.minus(pool.totalValueLockedUSD)
  );
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
  getOrCreatePoolDailySnapshot(event, pool);
  getOrCreatePoolHourlySnapshot(event, pool);
  updateProtocolOpenInterest(event, netChangeUSD);
}

export function addPoolMintVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(amountUSD);
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyVolumeUSD = dailySnapshot.dailyVolumeUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.hourlyVolumeUSD =
    hourlySnapshot.hourlyVolumeUSD.plus(amountUSD);
  hourlySnapshot.save();
  addProtocolMintVolume(event, amountUSD);
}

export function addPoolClosedVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeClosedVolumeUSD =
    pool.cumulativeClosedVolumeUSD.plus(amountUSD);
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyClosedVolumeUSD =
    dailySnapshot.dailyClosedVolumeUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.save();
  addProtocolClosedVolume(event, amountUSD);
}

export function addPoolExercisedVolume(
  event: ethereum.Event,
  pool: LiquidityPool,
  amountUSD: BigDecimal
): void {
  pool.cumulativeExercisedVolumeUSD =
    pool.cumulativeExercisedVolumeUSD.plus(amountUSD);
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyExerciseVolumeUSD =
    dailySnapshot.dailyExerciseVolumeUSD.plus(amountUSD);
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  hourlySnapshot.save();
  addProtocolExercisedVolume(event, amountUSD);
}

export function incrementPoolPositionCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.openPositionCount += 1;
  pool.contractsTakenCount += 1;
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyContractsTakenCount += 1;
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolPositionCount(event);
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
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyContractsClosedCount += 1;
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  decrementProtocolPositionCount(event);
}

export function incrementPoolMintedCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  if (option.type == OptionType.CALL) {
    pool.callsMintedCount += 1;
    dailySnapshot.callsMintedCount += 1;
    dailySnapshot.dailyCallsMintedCount += 1;
  } else {
    pool.putsMintedCount += 1;
    dailySnapshot.putsMintedCount += 1;
    dailySnapshot.dailyPutsMintedCount += 1;
  }
  pool.contractsMintedCount += 1;
  pool.save();
  dailySnapshot.contractsMintedCount += 1;
  dailySnapshot.dailyContractsMintedCount += 1;
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolMintedCount(event, option);
}

export function incrementPoolTakenCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.contractsTakenCount += 1;
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyContractsTakenCount += 1;
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolTakenCount(event);
}

export function incrementPoolExercisedCount(
  event: ethereum.Event,
  option: Option
): void {
  const pool = LiquidityPool.load(option.pool)!;
  pool.contractsExercisedCount += 1;
  pool.save();
  const dailySnapshot = getOrCreatePoolDailySnapshot(event, pool);
  dailySnapshot.dailyContractsExercisedCount += 1;
  dailySnapshot.save();
  const hourlySnapshot = getOrCreatePoolHourlySnapshot(event, pool);
  incrementProtocolExercisedCount(event);
}

function getOrCreatePoolDailySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): LiquidityPoolDailySnapshot {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromUTF8(`${pool.id.toHex()}-${days}`);
  const protocol = getOrCreateOpynProtocol();
  let snapshot = LiquidityPoolDailySnapshot.load(id);
  if (!snapshot) {
    snapshot = new LiquidityPoolDailySnapshot(id);
    snapshot.days = days;
    snapshot.protocol = protocol.id;
    snapshot.pool = pool.id;
    snapshot.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.dailyEntryPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyExitPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyDepositPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.dailyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.dailyVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    snapshot.dailyDepositedVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyDepositedVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.dailyDepositedVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    snapshot.dailyWithdrawVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyWithdrawVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.dailyWithdrawVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    snapshot.dailyClosedVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.dailyExerciseVolumeUSD = BIGDECIMAL_ZERO;

    snapshot.dailyPutsMintedCount = INT_ZERO;
    snapshot.dailyCallsMintedCount = INT_ZERO;
    snapshot.dailyContractsMintedCount = INT_ZERO;
    snapshot.dailyContractsTakenCount = INT_ZERO;
    snapshot.dailyContractsExpiredCount = INT_ZERO;
    snapshot.dailyContractsExercisedCount = INT_ZERO;
    snapshot.dailyContractsClosedCount = INT_ZERO;
  }
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  snapshot.cumulativeEntryPremiumUSD = pool.cumulativeEntryPremiumUSD;
  snapshot.cumulativeExitPremiumUSD = pool.cumulativeExitPremiumUSD;
  snapshot.cumulativeTotalPremiumUSD = pool.cumulativeTotalPremiumUSD;
  snapshot.cumulativeDepositPremiumUSD = pool.cumulativeDepositPremiumUSD;
  snapshot.cumulativeWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD;
  snapshot.cumulativeTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD;
  snapshot.openInterestUSD = pool.openInterestUSD;
  snapshot.putsMintedCount = pool.putsMintedCount;
  snapshot.callsMintedCount = pool.callsMintedCount;
  snapshot.contractsMintedCount = pool.contractsMintedCount;
  snapshot.contractsTakenCount = pool.contractsTakenCount;
  snapshot.contractsExpiredCount = pool.contractsExpiredCount;
  snapshot.contractsExercisedCount = pool.contractsExercisedCount;
  snapshot.contractsClosedCount = pool.contractsClosedCount;
  snapshot.openPositionCount = pool.openPositionCount;
  snapshot.closedPositionCount = pool.closedPositionCount;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.cumulativeDepositedVolumeUSD = pool.cumulativeDepositVolumeUSD;
  snapshot.cumulativeWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD;
  snapshot.cumulativeClosedVolumeUSD = pool.cumulativeClosedVolumeUSD;
  snapshot.cumulativeExerciseVolumeUSD = pool.cumulativeExercisedVolumeUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  snapshot.save();
  return snapshot;
}

function getOrCreatePoolHourlySnapshot(
  event: ethereum.Event,
  pool: LiquidityPool
): LiquidityPoolHourlySnapshot {
  const hours = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const id = Bytes.fromUTF8(`${pool.id.toHex()}-${hours}`);
  const protocol = getOrCreateOpynProtocol();
  let snapshot = LiquidityPoolHourlySnapshot.load(id);
  if (!snapshot) {
    snapshot = new LiquidityPoolHourlySnapshot(id);
    snapshot.hours = hours;
    snapshot.protocol = protocol.id;
    snapshot.pool = pool.id;
    snapshot.hourlySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyTotalRevenueUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyEntryPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyExitPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyTotalPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyDepositPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyWithdrawPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.hourlyVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    snapshot.hourlyDepositVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyDepositVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.hourlyDepositVolumeByTokenUSD = [BIGDECIMAL_ZERO];
    snapshot.hourlyWithdrawVolumeUSD = BIGDECIMAL_ZERO;
    snapshot.hourlyWithdrawVolumeByTokenAmount = [BIGINT_ZERO];
    snapshot.hourlyWithdrawVolumeByTokenUSD = [BIGDECIMAL_ZERO];
  }
  snapshot.totalValueLockedUSD = pool.totalValueLockedUSD;
  snapshot.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  snapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  snapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  snapshot.cumulativeEntryPremiumUSD = pool.cumulativeEntryPremiumUSD;
  snapshot.cumulativeExitPremiumUSD = pool.cumulativeExitPremiumUSD;
  snapshot.cumulativeTotalPremiumUSD = pool.cumulativeTotalPremiumUSD;
  snapshot.cumulativeDepositPremiumUSD = pool.cumulativeDepositPremiumUSD;
  snapshot.cumulativeWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD;
  snapshot.cumulativeTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD;
  snapshot.openInterestUSD = pool.openInterestUSD;
  snapshot.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  snapshot.cumulativeDepositVolumeUSD = pool.cumulativeDepositVolumeUSD;
  snapshot.cumulativeWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD;
  snapshot.inputTokenBalances = pool.inputTokenBalances;
  snapshot.inputTokenWeights = pool.inputTokenWeights;
  snapshot.outputTokenSupply = pool.outputTokenSupply;
  snapshot.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  snapshot.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  snapshot.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  snapshot.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  snapshot.save();
  return snapshot;
}

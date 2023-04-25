import {
  Address,
  Bytes,
  BigInt,
  ethereum,
  log,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  ActiveAccount,
  DerivOptProtocol,
  FinancialsDailySnapshot,
  LiquidityPool,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _TempUsageMetricsDailySnapshot,
  _TempUsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { EventType } from "./event";
import { getOrCreateProtocol, updateProtocolSnapshotDayID } from "./protocol";
import {
  getOrCreateLiquidityPool,
  updatePoolSnapshotDayID,
  updatePoolSnapshotHourID,
} from "./pool";
import {
  BIGDECIMAL_ZERO,
  INT_ONE,
  INT_ZERO,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  BIGINT_ZERO,
} from "../utils/constants";

// snapshots are only snapped once per interval for efficiency.
export function takeSnapshots(
  event: ethereum.Event,
  poolAddress: Address
): void {
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const protocol = getOrCreateProtocol();
  const protocolSnapshotDayID =
    protocol._lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
  const protocolSnapshotHourID =
    protocol._lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;

  if (protocolSnapshotDayID != dayID && protocolSnapshotDayID != INT_ZERO) {
    takeFinancialDailySnapshot(protocol, protocolSnapshotDayID);
    takeUsageMetricsDailySnapshot(protocol, protocolSnapshotDayID);
    updateProtocolSnapshotDayID(protocolSnapshotDayID);
  }
  if (protocolSnapshotHourID != hourID && protocolSnapshotHourID != INT_ZERO) {
    takeUsageMetricsHourlySnapshot(protocol, protocolSnapshotHourID);
  }

  const pool = getOrCreateLiquidityPool(event, poolAddress);
  const poolSnapshotDayID =
    pool._lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
  const poolSnapshotHourID =
    pool._lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;
  if (poolSnapshotDayID != dayID && poolSnapshotDayID != INT_ZERO) {
    takeLiquidityPoolDailySnapshot(pool, poolSnapshotDayID);
    updatePoolSnapshotDayID(pool, poolSnapshotDayID);
  }
  if (poolSnapshotHourID != hourID && poolSnapshotHourID != INT_ZERO) {
    takeLiquidityPoolHourlySnapshot(pool, poolSnapshotHourID);
    updatePoolSnapshotHourID(pool, poolSnapshotHourID);
  }
}

export function takeLiquidityPoolDailySnapshot(
  pool: LiquidityPool,
  day: i32
): void {
  const id = pool.id.concatI32(day);
  if (LiquidityPoolDailySnapshot.load(id)) {
    return;
  }
  const poolMetrics = new LiquidityPoolDailySnapshot(id);
  const prevPoolMetrics = LiquidityPoolDailySnapshot.load(
    pool.id.concatI32(pool._lastSnapshotDayID)
  );
  const inputTokenLength = pool.inputTokens.length;

  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeCollateralVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositedVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExerciseVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeDepositedVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeDepositedVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeWithdrawVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeWithdrawVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevCallsMintedCount = INT_ZERO;
  let prevPutsMintedCount = INT_ZERO;
  let prevContractsMintedCount = INT_ZERO;
  let prevContractsTakenCount = INT_ZERO;
  let prevContractsExpiredCount = INT_ZERO;
  let prevContractsExercisedCount = INT_ZERO;
  let prevContractsClosedCount = INT_ZERO;

  if (prevPoolMetrics) {
    prevCumulativeSupplySideRevenueUSD =
      prevPoolMetrics.cumulativeSupplySideRevenueUSD;
    prevCumulativeProtocolSideRevenueUSD =
      prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
    prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;

    prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
    prevCumulativeCollateralVolumeUSD =
      prevPoolMetrics.cumulativeCollateralVolumeUSD!;
    prevCumulativeDepositedVolumeUSD =
      prevPoolMetrics.cumulativeDepositedVolumeUSD;
    prevCumulativeWithdrawVolumeUSD =
      prevPoolMetrics.cumulativeWithdrawVolumeUSD;
    prevCumulativeClosedVolumeUSD = prevPoolMetrics.cumulativeClosedVolumeUSD;
    prevCumulativeExerciseVolumeUSD =
      prevPoolMetrics.cumulativeExerciseVolumeUSD;
    prevCumulativeVolumeByTokenAmount =
      prevPoolMetrics.cumulativeVolumeByTokenAmount;
    prevCumulativeVolumeByTokenUSD = prevPoolMetrics.cumulativeVolumeByTokenUSD;
    prevCumulativeDepositedVolumeByTokenAmount =
      prevPoolMetrics.cumulativeDepositedVolumeByTokenAmount;
    prevCumulativeDepositedVolumeByTokenUSD =
      prevPoolMetrics.cumulativeDepositedVolumeByTokenUSD;
    prevCumulativeWithdrawVolumeByTokenAmount =
      prevPoolMetrics.cumulativeWithdrawVolumeByTokenAmount;
    prevCumulativeWithdrawVolumeByTokenUSD =
      prevPoolMetrics.cumulativeWithdrawVolumeByTokenUSD;

    prevCumulativeEntryPremiumUSD = prevPoolMetrics.cumulativeEntryPremiumUSD;
    prevCumulativeExitPremiumUSD = prevPoolMetrics.cumulativeExitPremiumUSD;
    prevCumulativeTotalPremiumUSD = prevPoolMetrics.cumulativeTotalPremiumUSD;
    prevCumulativeDepositPremiumUSD =
      prevPoolMetrics.cumulativeDepositPremiumUSD;
    prevCumulativeWithdrawPremiumUSD =
      prevPoolMetrics.cumulativeWithdrawPremiumUSD;
    prevCumulativeTotalLiquidityPremiumUSD =
      prevPoolMetrics.cumulativeTotalLiquidityPremiumUSD;

    prevCallsMintedCount = prevPoolMetrics.callsMintedCount;
    prevPutsMintedCount = prevPoolMetrics.putsMintedCount;
    prevContractsMintedCount = prevPoolMetrics.contractsMintedCount;
    prevContractsTakenCount = prevPoolMetrics.contractsTakenCount;
    prevContractsExpiredCount = prevPoolMetrics.contractsExpiredCount;
    prevContractsExercisedCount = prevPoolMetrics.contractsExercisedCount;
    prevContractsClosedCount = prevPoolMetrics.contractsClosedCount;
  } else if (pool._lastSnapshotDayID > INT_ZERO) {
    log.error(
      "Missing daily pool snapshot at ID that has been snapped: Pool {}, ID {} ",
      [pool.id.toHexString(), pool._lastSnapshotDayID.toString()]
    );
  }

  poolMetrics.days = day;
  poolMetrics.protocol = pool.protocol;
  poolMetrics.pool = pool.id;

  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.inputTokenWeights = pool.inputTokenWeights;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolMetrics.dailySupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.minus(
      prevCumulativeSupplySideRevenueUSD
    );
  poolMetrics.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetrics.dailySupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.minus(
      prevCumulativeSupplySideRevenueUSD
    );
  poolMetrics.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetrics.dailyProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.minus(
      prevCumulativeProtocolSideRevenueUSD
    );
  poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetrics.dailyTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.minus(
    prevCumulativeTotalRevenueUSD
  );
  poolMetrics.openInterestUSD = pool.openInterestUSD;

  poolMetrics.dailyEntryPremiumUSD = pool.cumulativeEntryPremiumUSD.minus(
    prevCumulativeEntryPremiumUSD
  );
  poolMetrics.cumulativeEntryPremiumUSD = pool.cumulativeEntryPremiumUSD;
  poolMetrics.dailyExitPremiumUSD = pool.cumulativeExitPremiumUSD.minus(
    prevCumulativeExitPremiumUSD
  );
  poolMetrics.cumulativeExitPremiumUSD = pool.cumulativeExitPremiumUSD;
  poolMetrics.dailyTotalPremiumUSD = pool.cumulativeTotalPremiumUSD.minus(
    prevCumulativeTotalPremiumUSD
  );
  poolMetrics.cumulativeTotalPremiumUSD = pool.cumulativeTotalPremiumUSD;
  poolMetrics.dailyDepositPremiumUSD = pool.cumulativeDepositPremiumUSD.minus(
    prevCumulativeDepositPremiumUSD
  );
  poolMetrics.cumulativeDepositPremiumUSD = pool.cumulativeDepositPremiumUSD;
  poolMetrics.dailyWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD.minus(
    prevCumulativeWithdrawPremiumUSD
  );
  poolMetrics.cumulativeWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD;
  poolMetrics.dailyTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD.minus(
      prevCumulativeTotalLiquidityPremiumUSD
    );
  poolMetrics.cumulativeTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD;

  poolMetrics.dailyVolumeUSD = pool.cumulativeVolumeUSD.minus(
    prevCumulativeVolumeUSD
  );
  poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetrics.dailyCollateralVolumeUSD =
    pool.cumulativeCollateralVolumeUSD!.minus(
      prevCumulativeCollateralVolumeUSD
    );
  poolMetrics.cumulativeCollateralVolumeUSD =
    pool.cumulativeCollateralVolumeUSD;

  poolMetrics.dailyDepositedVolumeUSD = pool.cumulativeDepositedVolumeUSD.minus(
    prevCumulativeDepositedVolumeUSD
  );
  poolMetrics.cumulativeDepositedVolumeUSD = pool.cumulativeDepositedVolumeUSD;
  poolMetrics.dailyWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD.minus(
    prevCumulativeWithdrawVolumeUSD
  );
  poolMetrics.cumulativeWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD;
  poolMetrics.dailyClosedVolumeUSD = pool.cumulativeClosedVolumeUSD.minus(
    prevCumulativeClosedVolumeUSD
  );
  poolMetrics.cumulativeClosedVolumeUSD = pool.cumulativeClosedVolumeUSD;
  poolMetrics.dailyExerciseVolumeUSD = pool.cumulativeExercisedVolumeUSD.minus(
    prevCumulativeExerciseVolumeUSD
  );
  poolMetrics.cumulativeExerciseVolumeUSD = pool.cumulativeExercisedVolumeUSD;

  poolMetrics.cumulativeVolumeByTokenAmount =
    pool.cumulativeVolumeByTokenAmount;
  poolMetrics.cumulativeVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;

  poolMetrics.cumulativeDepositedVolumeByTokenAmount =
    pool.cumulativeDepositedVolumeByTokenAmount;
  poolMetrics.cumulativeDepositedVolumeByTokenUSD =
    pool.cumulativeDepositedVolumeByTokenUSD;
  poolMetrics.cumulativeWithdrawVolumeByTokenAmount =
    pool.cumulativeWithdrawVolumeByTokenAmount;
  poolMetrics.cumulativeWithdrawVolumeByTokenUSD =
    pool.cumulativeWithdrawVolumeByTokenUSD;
  const dailyVolumeByTokenAmount = pool.cumulativeVolumeByTokenAmount;
  const dailyVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
  const dailyDepositedVolumeByTokenAmount =
    pool.cumulativeDepositedVolumeByTokenAmount;
  const dailyDepositedVolumeByTokenUSD =
    pool.cumulativeDepositedVolumeByTokenUSD;
  const dailyWithdrawVolumeByTokenAmount =
    pool.cumulativeWithdrawVolumeByTokenAmount;
  const dailyWithdrawVolumeByTokenUSD = pool.cumulativeWithdrawVolumeByTokenUSD;
  for (let i = 0; i < inputTokenLength; i++) {
    dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].minus(
      prevCumulativeVolumeByTokenAmount[i]
    );
    dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].minus(
      prevCumulativeVolumeByTokenUSD[i]
    );
    dailyDepositedVolumeByTokenAmount[i] = dailyDepositedVolumeByTokenAmount[
      i
    ].minus(prevCumulativeDepositedVolumeByTokenAmount[i]);

    dailyDepositedVolumeByTokenUSD[i] = dailyDepositedVolumeByTokenUSD[i].minus(
      prevCumulativeDepositedVolumeByTokenUSD[i]
    );
    dailyWithdrawVolumeByTokenAmount[i] = dailyWithdrawVolumeByTokenAmount[
      i
    ].minus(prevCumulativeWithdrawVolumeByTokenAmount[i]);
    dailyWithdrawVolumeByTokenUSD[i] = dailyWithdrawVolumeByTokenUSD[i].minus(
      prevCumulativeWithdrawVolumeByTokenUSD[i]
    );
  }
  poolMetrics.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  poolMetrics.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  poolMetrics.dailyDepositedVolumeByTokenAmount =
    dailyDepositedVolumeByTokenAmount;
  poolMetrics.dailyDepositedVolumeByTokenUSD = dailyDepositedVolumeByTokenUSD;
  poolMetrics.dailyWithdrawVolumeByTokenAmount =
    dailyWithdrawVolumeByTokenAmount;
  poolMetrics.dailyWithdrawVolumeByTokenUSD = dailyWithdrawVolumeByTokenUSD;

  poolMetrics.dailyCallsMintedCount =
    pool.callsMintedCount - prevCallsMintedCount;
  poolMetrics.callsMintedCount = pool.callsMintedCount;
  poolMetrics.dailyPutsMintedCount = pool.putsMintedCount - prevPutsMintedCount;
  poolMetrics.putsMintedCount = pool.putsMintedCount;

  poolMetrics.dailyContractsMintedCount =
    pool.contractsMintedCount - prevContractsMintedCount;
  poolMetrics.contractsMintedCount = pool.contractsMintedCount;
  poolMetrics.dailyContractsTakenCount =
    pool.contractsTakenCount - prevContractsTakenCount;
  poolMetrics.contractsTakenCount = pool.contractsTakenCount;
  poolMetrics.dailyContractsExpiredCount =
    pool.contractsExpiredCount - prevContractsExpiredCount;
  poolMetrics.contractsExpiredCount = pool.contractsExpiredCount;
  poolMetrics.dailyContractsExercisedCount =
    pool.contractsExercisedCount - prevContractsExercisedCount;
  poolMetrics.contractsExercisedCount = pool.contractsExercisedCount;
  poolMetrics.dailyContractsClosedCount =
    pool.contractsClosedCount - prevContractsClosedCount;
  poolMetrics.contractsClosedCount = pool.contractsClosedCount;
  poolMetrics.dailyContractsExercisedCount =
    pool.contractsExercisedCount - prevContractsExercisedCount;
  poolMetrics.contractsExercisedCount = pool.contractsExercisedCount;
  poolMetrics.openPositionCount = pool.openPositionCount;
  poolMetrics.closedPositionCount = pool.closedPositionCount;

  poolMetrics.save();
}

export function takeLiquidityPoolHourlySnapshot(
  pool: LiquidityPool,
  hour: i32
): void {
  const id = pool.id.concatI32(hour);
  if (LiquidityPoolHourlySnapshot.load(id)) {
    return;
  }
  const poolMetrics = new LiquidityPoolHourlySnapshot(id);
  const prevPoolMetrics = LiquidityPoolHourlySnapshot.load(
    pool.id.concatI32(pool._lastSnapshotHourID)
  );
  const inputTokenLength = pool.inputTokens.length;

  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositedVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeDepositedVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeDepositedVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeWithdrawVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeWithdrawVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);

  if (prevPoolMetrics) {
    prevCumulativeSupplySideRevenueUSD =
      prevPoolMetrics.cumulativeSupplySideRevenueUSD;
    prevCumulativeProtocolSideRevenueUSD =
      prevPoolMetrics.cumulativeProtocolSideRevenueUSD;
    prevCumulativeTotalRevenueUSD = prevPoolMetrics.cumulativeTotalRevenueUSD;

    prevCumulativeEntryPremiumUSD = prevPoolMetrics.cumulativeEntryPremiumUSD;
    prevCumulativeExitPremiumUSD = prevPoolMetrics.cumulativeExitPremiumUSD;
    prevCumulativeTotalPremiumUSD = prevPoolMetrics.cumulativeTotalPremiumUSD;
    prevCumulativeDepositPremiumUSD =
      prevPoolMetrics.cumulativeDepositPremiumUSD;
    prevCumulativeWithdrawPremiumUSD =
      prevPoolMetrics.cumulativeWithdrawPremiumUSD;
    prevCumulativeTotalLiquidityPremiumUSD =
      prevPoolMetrics.cumulativeTotalLiquidityPremiumUSD;

    prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
    prevCumulativeDepositedVolumeUSD =
      prevPoolMetrics.cumulativeDepositVolumeUSD;
    prevCumulativeWithdrawVolumeUSD =
      prevPoolMetrics.cumulativeWithdrawVolumeUSD;
    prevCumulativeVolumeByTokenAmount =
      prevPoolMetrics.cumulativeVolumeByTokenAmount;
    prevCumulativeVolumeByTokenUSD = prevPoolMetrics.cumulativeVolumeByTokenUSD;
    prevCumulativeDepositedVolumeByTokenAmount =
      prevPoolMetrics.cumulativeDepositVolumeByTokenAmount;
    prevCumulativeDepositedVolumeByTokenUSD =
      prevPoolMetrics.cumulativeDepositVolumeByTokenUSD;
    prevCumulativeWithdrawVolumeByTokenAmount =
      prevPoolMetrics.cumulativeWithdrawVolumeByTokenAmount;
    prevCumulativeWithdrawVolumeByTokenUSD =
      prevPoolMetrics.cumulativeWithdrawVolumeByTokenUSD;
  } else if (pool._lastSnapshotHourID > INT_ZERO) {
    log.error(
      "Missing hourly pool snapshot at ID that has been snapped: Pool {}, ID {} ",
      [pool.id.toHexString(), pool._lastSnapshotHourID.toString()]
    );
  }

  poolMetrics.hours = hour;
  poolMetrics.protocol = pool.protocol;
  poolMetrics.pool = pool.id;

  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.openInterestUSD = pool.openInterestUSD;

  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.inputTokenWeights = pool.inputTokenWeights;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolMetrics.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetrics.hourlySupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.minus(
      prevCumulativeSupplySideRevenueUSD
    );
  poolMetrics.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolMetrics.hourlyProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.minus(
      prevCumulativeProtocolSideRevenueUSD
    );
  poolMetrics.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetrics.hourlyTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.minus(
    prevCumulativeTotalRevenueUSD
  );

  poolMetrics.hourlyEntryPremiumUSD = pool.cumulativeEntryPremiumUSD.minus(
    prevCumulativeEntryPremiumUSD
  );
  poolMetrics.cumulativeEntryPremiumUSD = pool.cumulativeEntryPremiumUSD;
  poolMetrics.hourlyExitPremiumUSD = pool.cumulativeExitPremiumUSD.minus(
    prevCumulativeExitPremiumUSD
  );
  poolMetrics.cumulativeExitPremiumUSD = pool.cumulativeExitPremiumUSD;
  poolMetrics.hourlyTotalPremiumUSD = pool.cumulativeTotalPremiumUSD.minus(
    prevCumulativeTotalPremiumUSD
  );
  poolMetrics.cumulativeTotalPremiumUSD = pool.cumulativeTotalPremiumUSD;
  poolMetrics.hourlyDepositPremiumUSD = pool.cumulativeDepositPremiumUSD.minus(
    prevCumulativeDepositPremiumUSD
  );
  poolMetrics.cumulativeDepositPremiumUSD = pool.cumulativeDepositPremiumUSD;
  poolMetrics.hourlyWithdrawPremiumUSD =
    pool.cumulativeWithdrawPremiumUSD.minus(prevCumulativeWithdrawPremiumUSD);
  poolMetrics.cumulativeWithdrawPremiumUSD = pool.cumulativeWithdrawPremiumUSD;
  poolMetrics.hourlyTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD.minus(
      prevCumulativeTotalLiquidityPremiumUSD
    );
  poolMetrics.cumulativeTotalLiquidityPremiumUSD =
    pool.cumulativeTotalLiquidityPremiumUSD;

  poolMetrics.hourlyVolumeUSD = pool.cumulativeVolumeUSD.minus(
    prevCumulativeVolumeUSD
  );
  poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetrics.hourlyDepositVolumeUSD = pool.cumulativeDepositedVolumeUSD.minus(
    prevCumulativeDepositedVolumeUSD
  );
  poolMetrics.cumulativeDepositVolumeUSD = pool.cumulativeDepositedVolumeUSD;
  poolMetrics.hourlyWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD.minus(
    prevCumulativeWithdrawVolumeUSD
  );
  poolMetrics.cumulativeWithdrawVolumeUSD = pool.cumulativeWithdrawVolumeUSD;

  poolMetrics.cumulativeVolumeByTokenAmount =
    pool.cumulativeVolumeByTokenAmount;
  poolMetrics.cumulativeVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
  poolMetrics.cumulativeDepositVolumeByTokenAmount =
    pool.cumulativeDepositedVolumeByTokenAmount;
  poolMetrics.cumulativeDepositVolumeByTokenUSD =
    pool.cumulativeDepositedVolumeByTokenUSD;
  poolMetrics.cumulativeWithdrawVolumeByTokenAmount =
    pool.cumulativeWithdrawVolumeByTokenAmount;
  poolMetrics.cumulativeWithdrawVolumeByTokenUSD =
    pool.cumulativeWithdrawVolumeByTokenUSD;
  const hourlyVolumeByTokenAmount = pool.cumulativeVolumeByTokenAmount;
  const hourlyVolumeByTokenUSD = pool.cumulativeVolumeByTokenUSD;
  const hourlyDepositedVolumeByTokenAmount =
    pool.cumulativeDepositedVolumeByTokenAmount;
  const hourlyDepositedVolumeByTokenUSD =
    pool.cumulativeDepositedVolumeByTokenUSD;
  const hourlyWithdrawVolumeByTokenAmount =
    pool.cumulativeWithdrawVolumeByTokenAmount;
  const hourlyWithdrawVolumeByTokenUSD =
    pool.cumulativeWithdrawVolumeByTokenUSD;
  for (let i = 0; i < inputTokenLength; i++) {
    hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].minus(
      prevCumulativeVolumeByTokenAmount[i]
    );
    hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].minus(
      prevCumulativeVolumeByTokenUSD[i]
    );
    hourlyDepositedVolumeByTokenAmount[i] = hourlyDepositedVolumeByTokenAmount[
      i
    ].minus(prevCumulativeDepositedVolumeByTokenAmount[i]);

    hourlyDepositedVolumeByTokenUSD[i] = hourlyDepositedVolumeByTokenUSD[
      i
    ].minus(prevCumulativeDepositedVolumeByTokenUSD[i]);
    hourlyWithdrawVolumeByTokenAmount[i] = hourlyWithdrawVolumeByTokenAmount[
      i
    ].minus(prevCumulativeWithdrawVolumeByTokenAmount[i]);
    hourlyWithdrawVolumeByTokenUSD[i] = hourlyWithdrawVolumeByTokenUSD[i].minus(
      prevCumulativeWithdrawVolumeByTokenUSD[i]
    );
  }
  poolMetrics.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  poolMetrics.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  poolMetrics.hourlyDepositVolumeByTokenAmount =
    hourlyDepositedVolumeByTokenAmount;
  poolMetrics.hourlyDepositVolumeByTokenUSD = hourlyDepositedVolumeByTokenUSD;
  poolMetrics.hourlyWithdrawVolumeByTokenAmount =
    hourlyWithdrawVolumeByTokenAmount;
  poolMetrics.hourlyWithdrawVolumeByTokenUSD = hourlyWithdrawVolumeByTokenUSD;

  poolMetrics.save();
}

export function takeFinancialDailySnapshot(
  protocol: DerivOptProtocol,
  day: i32
): void {
  const id = Bytes.fromI32(day);
  if (FinancialsDailySnapshot.load(id)) {
    return;
  }

  const financialMetrics = new FinancialsDailySnapshot(id);
  const prevFinancialMetrics = FinancialsDailySnapshot.load(
    Bytes.fromI32(protocol._lastSnapshotDayID)
  );

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeCollateralVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExercisedVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedVolumeUSD = BIGDECIMAL_ZERO;

  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevPutsMintedCount = INT_ZERO;
  let prevCallsMintedCount = INT_ZERO;
  let prevContractsMintedCount = INT_ZERO;
  let prevContractsTakenCount = INT_ZERO;
  let prevContractsExpiredCount = INT_ZERO;
  let prevContractsExercisedCount = INT_ZERO;
  let prevContractsClosedCount = INT_ZERO;

  if (prevFinancialMetrics) {
    prevCumulativeVolumeUSD = prevFinancialMetrics.cumulativeVolumeUSD;
    prevCumulativeCollateralVolumeUSD =
      prevFinancialMetrics.cumulativeCollateralVolumeUSD!;
    prevCumulativeExercisedVolumeUSD =
      prevFinancialMetrics.cumulativeExercisedVolumeUSD;
    prevCumulativeClosedVolumeUSD =
      prevFinancialMetrics.cumulativeClosedVolumeUSD;

    prevCumulativeSupplySideRevenueUSD =
      prevFinancialMetrics.cumulativeSupplySideRevenueUSD;
    prevCumulativeProtocolSideRevenueUSD =
      prevFinancialMetrics.cumulativeProtocolSideRevenueUSD;
    prevCumulativeTotalRevenueUSD =
      prevFinancialMetrics.cumulativeTotalRevenueUSD;
    prevCumulativeEntryPremiumUSD =
      prevFinancialMetrics.cumulativeEntryPremiumUSD;
    prevCumulativeExitPremiumUSD =
      prevFinancialMetrics.cumulativeExitPremiumUSD;
    prevCumulativeTotalPremiumUSD =
      prevFinancialMetrics.cumulativeTotalPremiumUSD;
    prevCumulativeDepositPremiumUSD =
      prevFinancialMetrics.cumulativeDepositPremiumUSD;
    prevCumulativeWithdrawPremiumUSD =
      prevFinancialMetrics.cumulativeWithdrawPremiumUSD;
    prevCumulativeTotalLiquidityPremiumUSD =
      prevFinancialMetrics.cumulativeTotalLiquidityPremiumUSD;

    prevPutsMintedCount = prevFinancialMetrics.putsMintedCount;
    prevCallsMintedCount = prevFinancialMetrics.callsMintedCount;
    prevContractsMintedCount = prevFinancialMetrics.contractsMintedCount;
    prevContractsTakenCount = prevFinancialMetrics.contractsTakenCount;
    prevContractsExpiredCount = prevFinancialMetrics.contractsExpiredCount;
    prevContractsExercisedCount = prevFinancialMetrics.contractsExercisedCount;
    prevContractsClosedCount = prevFinancialMetrics.contractsClosedCount;
  } else if (protocol._lastSnapshotDayID > INT_ZERO) {
    log.error(
      "Missing protocol snapshot at ID that has been snapped: Protocol {}, ID {} ",
      [protocol.id.toHexString(), protocol._lastSnapshotDayID.toString()]
    );
  }

  financialMetrics.days = day;
  financialMetrics.protocol = protocol.id;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.dailyVolumeUSD = protocol.cumulativeVolumeUSD.minus(
    prevCumulativeVolumeUSD
  );
  financialMetrics.cumulativeCollateralVolumeUSD =
    protocol.cumulativeCollateralVolumeUSD;
  financialMetrics.dailyCollateralVolumeUSD =
    protocol.cumulativeCollateralVolumeUSD!.minus(
      prevCumulativeCollateralVolumeUSD
    );
  financialMetrics.cumulativeExercisedVolumeUSD =
    protocol.cumulativeExercisedVolumeUSD;
  financialMetrics.dailyExercisedVolumeUSD =
    protocol.cumulativeExercisedVolumeUSD.minus(
      prevCumulativeExercisedVolumeUSD
    );
  financialMetrics.cumulativeClosedVolumeUSD =
    protocol.cumulativeClosedVolumeUSD;
  financialMetrics.dailyClosedVolumeUSD =
    protocol.cumulativeClosedVolumeUSD.minus(prevCumulativeClosedVolumeUSD);
  financialMetrics.openInterestUSD = protocol.openInterestUSD;

  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.dailySupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.minus(
      prevCumulativeSupplySideRevenueUSD
    );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.minus(
      prevCumulativeProtocolSideRevenueUSD
    );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.minus(prevCumulativeTotalRevenueUSD);
  financialMetrics.dailyEntryPremiumUSD =
    protocol.cumulativeEntryPremiumUSD.minus(prevCumulativeEntryPremiumUSD);
  financialMetrics.cumulativeEntryPremiumUSD =
    protocol.cumulativeEntryPremiumUSD;
  financialMetrics.dailyExitPremiumUSD =
    protocol.cumulativeExitPremiumUSD.minus(prevCumulativeExitPremiumUSD);
  financialMetrics.cumulativeExitPremiumUSD = protocol.cumulativeExitPremiumUSD;
  financialMetrics.dailyTotalPremiumUSD =
    protocol.cumulativeTotalPremiumUSD.minus(prevCumulativeTotalPremiumUSD);
  financialMetrics.cumulativeTotalPremiumUSD =
    protocol.cumulativeTotalPremiumUSD;
  financialMetrics.dailyDepositPremiumUSD =
    protocol.cumulativeDepositPremiumUSD.minus(prevCumulativeDepositPremiumUSD);
  financialMetrics.cumulativeDepositPremiumUSD =
    protocol.cumulativeDepositPremiumUSD;
  financialMetrics.dailyWithdrawPremiumUSD =
    protocol.cumulativeWithdrawPremiumUSD.minus(
      prevCumulativeWithdrawPremiumUSD
    );
  financialMetrics.cumulativeWithdrawPremiumUSD =
    protocol.cumulativeWithdrawPremiumUSD;
  financialMetrics.dailyTotalLiquidityPremiumUSD =
    protocol.cumulativeTotalLiquidityPremiumUSD.minus(
      prevCumulativeTotalLiquidityPremiumUSD
    );
  financialMetrics.cumulativeTotalLiquidityPremiumUSD =
    protocol.cumulativeTotalLiquidityPremiumUSD;

  financialMetrics.dailyPutsMintedCount =
    protocol.putsMintedCount - prevPutsMintedCount;
  financialMetrics.putsMintedCount = protocol.putsMintedCount;
  financialMetrics.dailyCallsMintedCount =
    protocol.callsMintedCount - prevCallsMintedCount;
  financialMetrics.callsMintedCount = protocol.callsMintedCount;
  financialMetrics.dailyContractsMintedCount =
    protocol.contractsMintedCount - prevContractsMintedCount;
  financialMetrics.contractsMintedCount = protocol.contractsMintedCount;
  financialMetrics.dailyContractsTakenCount =
    protocol.contractsTakenCount - prevContractsTakenCount;
  financialMetrics.contractsTakenCount = protocol.contractsTakenCount;
  financialMetrics.dailyContractsExpiredCount =
    protocol.contractsExpiredCount - prevContractsExpiredCount;
  financialMetrics.contractsExpiredCount = protocol.contractsExpiredCount;
  financialMetrics.dailyContractsExercisedCount =
    protocol.contractsExercisedCount - prevContractsExercisedCount;
  financialMetrics.contractsExercisedCount = protocol.contractsExercisedCount;
  financialMetrics.dailyContractsClosedCount =
    protocol.contractsClosedCount - prevContractsClosedCount;
  financialMetrics.contractsClosedCount = protocol.contractsClosedCount;
  financialMetrics.openPositionCount = protocol.openPositionCount;
  financialMetrics.closedPositionCount = protocol.closedPositionCount;

  financialMetrics.save();
}

export function takeUsageMetricsDailySnapshot(
  protocol: DerivOptProtocol,
  day: i32
): void {
  // Create unique id for the day
  const id = Bytes.fromI32(day);
  if (UsageMetricsDailySnapshot.load(id)) {
    return;
  }

  const usageMetrics = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
  usageMetrics.days = day;
  usageMetrics.protocol = protocol.id;

  const tempUsageMetrics = _TempUsageMetricsDailySnapshot.load(id);
  if (tempUsageMetrics) {
    usageMetrics.dailyActiveUsers = tempUsageMetrics.dailyActiveUsers;
    usageMetrics.dailyUniqueLP = tempUsageMetrics.dailyActiveUsers;
    usageMetrics.dailyUniqueTakers = tempUsageMetrics.dailyActiveUsers;

    usageMetrics.dailyTransactionCount = tempUsageMetrics.dailyTransactionCount;
    usageMetrics.dailyDepositCount = tempUsageMetrics.dailyDepositCount;
    usageMetrics.dailyWithdrawCount = tempUsageMetrics.dailyWithdrawCount;
    usageMetrics.dailySwapCount = tempUsageMetrics.dailySwapCount;
  } else {
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyUniqueLP = INT_ZERO;
    usageMetrics.dailyUniqueTakers = INT_ZERO;

    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;
  }

  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;

  usageMetrics.totalPoolCount = protocol.totalPoolCount;

  usageMetrics.save();
}

export function takeUsageMetricsHourlySnapshot(
  protocol: DerivOptProtocol,
  hour: i32
): void {
  // Create unique id for the hour
  const id = Bytes.fromI32(hour);
  if (UsageMetricsHourlySnapshot.load(id)) {
    return;
  }

  const usageMetrics = new UsageMetricsHourlySnapshot(id);
  usageMetrics.hours = hour;
  usageMetrics.protocol = protocol.id;

  const tempUsageMetrics = _TempUsageMetricsHourlySnapshot.load(id);
  if (tempUsageMetrics) {
    usageMetrics.hourlyActiveUsers = tempUsageMetrics.hourlyActiveUsers;

    usageMetrics.hourlyTransactionCount =
      tempUsageMetrics.hourlyTransactionCount;
    usageMetrics.hourlyDepositCount = tempUsageMetrics.hourlyDepositCount;
    usageMetrics.hourlyWithdrawCount = tempUsageMetrics.hourlyWithdrawCount;
    usageMetrics.hourlySwapCount = tempUsageMetrics.hourlySwapCount;
  } else {
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;
  }

  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;

  usageMetrics.save();

  return;
}

export function getOrCreateTempUsageMetricsDailySnapshot(
  event: ethereum.Event
): _TempUsageMetricsDailySnapshot {
  const protocol = getOrCreateProtocol();
  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  // Create unique id for the day
  const id = Bytes.fromI32(day);
  let usageMetrics = _TempUsageMetricsDailySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new _TempUsageMetricsDailySnapshot(id);
    usageMetrics.days = day;
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyUniqueLP = INT_ZERO;
    usageMetrics.dailyUniqueTakers = INT_ZERO;

    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateTempUsageMetricsHourlySnapshot(
  event: ethereum.Event
): _TempUsageMetricsHourlySnapshot {
  const protocol = getOrCreateProtocol();
  // Number of hours since Unix epoch
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const id = Bytes.fromI32(hour);
  // Create unique id for the day
  let usageMetrics = _TempUsageMetricsHourlySnapshot.load(id);

  if (!usageMetrics) {
    usageMetrics = new _TempUsageMetricsHourlySnapshot(id);
    usageMetrics.hours = hour;
    usageMetrics.protocol = protocol.id;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;

    usageMetrics.save();
  }

  return usageMetrics;
}

// Update temp usage metrics entities
export function updateTempUsageMetrics(
  event: ethereum.Event,
  fromAddress: Address,
  eventType: EventType
): void {
  const usageMetricsDaily = getOrCreateTempUsageMetricsDailySnapshot(event);
  const usageMetricsHourly = getOrCreateTempUsageMetricsHourlySnapshot(event);

  usageMetricsDaily.dailyTransactionCount += INT_ONE;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  switch (eventType) {
    case EventType.Deposit:
      usageMetricsDaily.dailyDepositCount += INT_ONE;
      usageMetricsHourly.hourlyDepositCount += INT_ONE;
      if (isUniqueDailyUser(event, fromAddress, eventType)) {
        usageMetricsDaily.dailyUniqueLP += INT_ONE;
      }
      break;
    case EventType.Withdraw:
      usageMetricsDaily.dailyWithdrawCount += INT_ONE;
      usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
      break;
    case EventType.Purchase:
      usageMetricsDaily.dailySwapCount += INT_ONE;
      usageMetricsHourly.hourlySwapCount += INT_ONE;
      if (isUniqueDailyUser(event, fromAddress, eventType)) {
        usageMetricsDaily.dailyUniqueTakers += INT_ONE;
      }
      usageMetricsDaily;
      break;
    case EventType.Settle:
      usageMetricsDaily.dailySwapCount += INT_ONE;
      usageMetricsHourly.hourlySwapCount += INT_ONE;
      break;
    default:
      break;
  }

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = fromAddress.concatI32(day);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = fromAddress.concatI32(hour);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  usageMetricsDaily.save();
  usageMetricsHourly.save();
}

function isUniqueDailyUser(
  event: ethereum.Event,
  fromAddress: Address,
  eventType: EventType
): boolean {
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  // Combine the id, user address, and action to generate a unique user id for the day
  const dailyActionActiveAccountId = fromAddress
    .concatI32(day)
    .concat(Bytes.fromUTF8(eventType.toString()));
  let dailyActionActiveAccount = ActiveAccount.load(dailyActionActiveAccountId);
  if (!dailyActionActiveAccount) {
    dailyActionActiveAccount = new ActiveAccount(dailyActionActiveAccountId);
    dailyActionActiveAccount.save();
    return true;
  }
  return false;
}

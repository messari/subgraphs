import { Address, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import {
  ActiveAccount,
  DerivPerpProtocol,
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
  PositionSide,
} from "../utils/constants";

// snapshots are only snapped once per interval for efficiency.
export function takeSnapshots(event: ethereum.Event): void {
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const protocol = getOrCreateProtocol();
  const protocolSnapshotDayID =
    protocol._lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
  const protocolSnapshotHourID =
    protocol._lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;
  if (protocolSnapshotDayID != dayID) {
    takeFinancialDailySnapshot(protocol, protocolSnapshotDayID);
    takeUsageMetricsDailySnapshot(protocol, protocolSnapshotDayID);
    updateProtocolSnapshotDayID(protocolSnapshotDayID);
  }
  if (protocolSnapshotHourID != hourID) {
    takeUsageMetricsHourlySnapshot(protocol, protocolSnapshotHourID);
  }

  const pool = getOrCreateLiquidityPool(event);
  const poolSnapshotDayID = pool._lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;
  const poolSnapshotHourID =
    pool._lastUpdateTimestamp.toI32() / SECONDS_PER_HOUR;
  if (poolSnapshotDayID != dayID) {
    takeLiquidityPoolDailySnapshot(pool, poolSnapshotDayID);
    updatePoolSnapshotDayID(event, poolSnapshotDayID);
  }
  if (poolSnapshotHourID != hourID) {
    takeLiquidityPoolHourlySnapshot(pool, poolSnapshotHourID);
    updatePoolSnapshotHourID(event, poolSnapshotHourID);
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

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevCumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;

  let prevCumulativeUniqueBorrowers = INT_ZERO;
  let prevCumulativeUniqueLiquidators = INT_ZERO;
  let prevCumulativeUniqueLiquidatees = INT_ZERO;

  let prevLongPositionCount = INT_ZERO;
  let prevShortPositionCount = INT_ZERO;
  let prevOpenPositionCount = INT_ZERO;
  let prevClosedPositionCount = INT_ZERO;
  let prevCumulativePositionCount = INT_ZERO;
  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  if (prevPoolMetrics) {
    prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
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

    prevCumulativeInflowVolumeUSD = prevPoolMetrics.cumulativeInflowVolumeUSD;
    prevCumulativeClosedInflowVolumeUSD =
      prevPoolMetrics.cumulativeClosedInflowVolumeUSD;
    prevCumulativeOutflowVolumeUSD = prevPoolMetrics.cumulativeOutflowVolumeUSD;

    prevLongPositionCount = prevPoolMetrics.longPositionCount;
    prevShortPositionCount = prevPoolMetrics.shortPositionCount;
    prevOpenPositionCount = prevPoolMetrics.openPositionCount;
    prevClosedPositionCount = prevPoolMetrics.closedPositionCount;
    prevCumulativePositionCount = prevPoolMetrics.cumulativePositionCount;
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
  poolMetrics.dailyOpenInterestUSD = pool.openInterestUSD;

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

  poolMetrics.dailyFundingrate = pool._fundingrate;
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
  poolMetrics.dailyVolumeByTokenAmount = [];
  poolMetrics.dailyVolumeByTokenUSD = [];
  poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetrics.dailyInflowVolumeUSD = pool._cumulativeInflowVolumeUSD.minus(
    prevCumulativeInflowVolumeUSD
  );
  poolMetrics.dailyInflowVolumeByTokenAmount = [];
  poolMetrics.dailyInflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeInflowVolumeUSD = pool._cumulativeInflowVolumeUSD;
  poolMetrics.dailyClosedInflowVolumeUSD =
    pool._cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  poolMetrics.dailyClosedInflowVolumeByTokenAmount = [];
  poolMetrics.dailyClosedInflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeClosedInflowVolumeUSD =
    pool._cumulativeClosedInflowVolumeUSD;
  poolMetrics.dailyOutflowVolumeUSD = pool._cumulativeOutflowVolumeUSD.minus(
    prevCumulativeOutflowVolumeUSD
  );
  poolMetrics.dailyOutflowVolumeByTokenAmount = [];
  poolMetrics.dailyOutflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeOutflowVolumeUSD = pool._cumulativeOutflowVolumeUSD;

  poolMetrics.dailyActiveBorrowers =
    pool.cumulativeUniqueBorrowers - prevCumulativeUniqueBorrowers;
  poolMetrics.cumulativeUniqueBorrowers = pool.cumulativeUniqueBorrowers;
  poolMetrics.dailyActiveLiquidators =
    pool.cumulativeUniqueLiquidators - prevCumulativeUniqueLiquidators;
  poolMetrics.cumulativeUniqueLiquidators = pool.cumulativeUniqueLiquidators;
  poolMetrics.dailyActiveLiquidatees =
    pool.cumulativeUniqueLiquidatees - prevCumulativeUniqueLiquidatees;
  poolMetrics.cumulativeUniqueLiquidatees = pool.cumulativeUniqueLiquidatees;

  poolMetrics.dailylongPositionCount =
    pool.longPositionCount - prevLongPositionCount >= 0
      ? pool.longPositionCount - prevLongPositionCount
      : INT_ZERO;
  poolMetrics.longPositionCount = pool.longPositionCount;
  poolMetrics.dailyshortPositionCount =
    pool.shortPositionCount - prevShortPositionCount >= 0
      ? pool.shortPositionCount - prevShortPositionCount
      : INT_ZERO;
  poolMetrics.shortPositionCount = pool.shortPositionCount;
  poolMetrics.dailyopenPositionCount =
    pool.openPositionCount - prevOpenPositionCount >= 0
      ? pool.openPositionCount - prevOpenPositionCount
      : INT_ZERO;
  poolMetrics.openPositionCount = pool.openPositionCount;
  poolMetrics.dailyclosedPositionCount =
    pool.closedPositionCount - prevClosedPositionCount;
  poolMetrics.closedPositionCount = pool.closedPositionCount;
  poolMetrics.dailycumulativePositionCount =
    pool.cumulativePositionCount - prevCumulativePositionCount;
  poolMetrics.cumulativePositionCount = pool.cumulativePositionCount;

  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.inputTokenWeights = pool.inputTokenWeights;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

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

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevCumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;

  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

  if (prevPoolMetrics) {
    prevCumulativeVolumeUSD = prevPoolMetrics.cumulativeVolumeUSD;
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

    prevCumulativeInflowVolumeUSD = prevPoolMetrics.cumulativeInflowVolumeUSD;
    prevCumulativeClosedInflowVolumeUSD =
      prevPoolMetrics.cumulativeClosedInflowVolumeUSD;
    prevCumulativeOutflowVolumeUSD = prevPoolMetrics.cumulativeOutflowVolumeUSD;
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
  poolMetrics.hourlyOpenInterestUSD = pool.openInterestUSD;

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

  poolMetrics.hourlyFundingrate = pool._fundingrate;
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
  poolMetrics.hourlyVolumeByTokenAmount = [];
  poolMetrics.hourlyVolumeByTokenUSD = [];
  poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetrics.hourlyInflowVolumeUSD = pool._cumulativeInflowVolumeUSD.minus(
    prevCumulativeInflowVolumeUSD
  );
  poolMetrics.hourlyInflowVolumeByTokenAmount = [];
  poolMetrics.hourlyInflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeInflowVolumeUSD = pool._cumulativeInflowVolumeUSD;
  poolMetrics.hourlyClosedInflowVolumeUSD =
    pool._cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  poolMetrics.hourlyClosedInflowVolumeByTokenAmount = [];
  poolMetrics.hourlyClosedInflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeClosedInflowVolumeUSD =
    pool._cumulativeClosedInflowVolumeUSD;
  poolMetrics.hourlyOutflowVolumeUSD = pool._cumulativeOutflowVolumeUSD.minus(
    prevCumulativeOutflowVolumeUSD
  );
  poolMetrics.hourlyOutflowVolumeByTokenAmount = [];
  poolMetrics.hourlyOutflowVolumeByTokenUSD = [];
  poolMetrics.cumulativeOutflowVolumeUSD = pool._cumulativeOutflowVolumeUSD;

  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.inputTokenWeights = pool.inputTokenWeights;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

  poolMetrics.save();
}

export function takeFinancialDailySnapshot(
  protocol: DerivPerpProtocol,
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
  let prevCumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;

  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeStakeSideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  if (prevFinancialMetrics != null) {
    prevCumulativeVolumeUSD = prevFinancialMetrics.cumulativeVolumeUSD;
    prevCumulativeInflowVolumeUSD =
      prevFinancialMetrics.cumulativeInflowVolumeUSD;
    prevCumulativeClosedInflowVolumeUSD =
      prevFinancialMetrics.cumulativeClosedInflowVolumeUSD;
    prevCumulativeOutflowVolumeUSD =
      prevFinancialMetrics.cumulativeOutflowVolumeUSD;
    prevCumulativeSupplySideRevenueUSD =
      prevFinancialMetrics.cumulativeSupplySideRevenueUSD;
    prevCumulativeProtocolSideRevenueUSD =
      prevFinancialMetrics.cumulativeProtocolSideRevenueUSD;
    prevCumulativeStakeSideRevenueUSD =
      prevFinancialMetrics.cumulativeStakeSideRevenueUSD;
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
  } else if (protocol._lastSnapshotDayID > INT_ZERO) {
    log.error(
      "Missing protocol snapshot at ID that has been snapped: Protocol {}, ID {} ",
      [protocol.id.toHexString(), protocol._lastSnapshotDayID.toString()]
    );
  }

  financialMetrics.days = day;
  financialMetrics.protocol = protocol.id;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.protocolControlledValueUSD =
    protocol.protocolControlledValueUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.dailyVolumeUSD = protocol.cumulativeVolumeUSD.minus(
    prevCumulativeVolumeUSD
  );
  financialMetrics.cumulativeInflowVolumeUSD =
    protocol._cumulativeInflowVolumeUSD;
  financialMetrics.dailyInflowVolumeUSD =
    protocol._cumulativeInflowVolumeUSD.minus(prevCumulativeInflowVolumeUSD);
  financialMetrics.cumulativeClosedInflowVolumeUSD =
    protocol._cumulativeClosedInflowVolumeUSD;
  financialMetrics.dailyClosedInflowVolumeUSD =
    protocol._cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  financialMetrics.cumulativeOutflowVolumeUSD =
    protocol._cumulativeOutflowVolumeUSD;
  financialMetrics.dailyOutflowVolumeUSD =
    protocol._cumulativeOutflowVolumeUSD.minus(prevCumulativeOutflowVolumeUSD);
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
  financialMetrics.cumulativeStakeSideRevenueUSD =
    protocol.cumulativeStakeSideRevenueUSD;
  financialMetrics.dailyStakeSideRevenueUSD =
    protocol.cumulativeStakeSideRevenueUSD.minus(
      prevCumulativeStakeSideRevenueUSD
    );
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
  financialMetrics.dailyOpenInterestUSD = protocol.openInterestUSD;

  financialMetrics.save();
}

export function takeUsageMetricsDailySnapshot(
  protocol: DerivPerpProtocol,
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
    usageMetrics.dailylongPositionCount =
      tempUsageMetrics.dailylongPositionCount;
    usageMetrics.dailyshortPositionCount =
      tempUsageMetrics.dailyshortPositionCount;
    usageMetrics.dailyopenPositionCount =
      tempUsageMetrics.dailyopenPositionCount;
    usageMetrics.dailyclosedPositionCount =
      tempUsageMetrics.dailyclosedPositionCount;
    usageMetrics.dailycumulativePositionCount =
      tempUsageMetrics.dailycumulativePositionCount;

    usageMetrics.dailyTransactionCount = tempUsageMetrics.dailyTransactionCount;
    usageMetrics.dailyDepositCount = tempUsageMetrics.dailyDepositCount;
    usageMetrics.dailyWithdrawCount = tempUsageMetrics.dailyWithdrawCount;
    usageMetrics.dailyBorrowCount = tempUsageMetrics.dailyBorrowCount;
    usageMetrics.dailySwapCount = tempUsageMetrics.dailySwapCount;

    usageMetrics.dailyActiveDepositors = tempUsageMetrics.dailyActiveDepositors;
    usageMetrics.dailyActiveBorrowers = tempUsageMetrics.dailyActiveBorrowers;
    usageMetrics.dailyActiveLiquidators =
      tempUsageMetrics.dailyActiveLiquidators;
    usageMetrics.dailyActiveLiquidatees =
      tempUsageMetrics.dailyActiveLiquidatees;
    usageMetrics.dailyActiveUsers = tempUsageMetrics.dailyActiveUsers;

    usageMetrics.dailyCollateralIn = tempUsageMetrics.dailyCollateralIn;
    usageMetrics.dailyCollateralOut = tempUsageMetrics.dailyCollateralOut;
  } else {
    usageMetrics.dailylongPositionCount = INT_ZERO;
    usageMetrics.dailyshortPositionCount = INT_ZERO;
    usageMetrics.dailyopenPositionCount = INT_ZERO;
    usageMetrics.dailyclosedPositionCount = INT_ZERO;
    usageMetrics.dailycumulativePositionCount = INT_ZERO;

    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.dailyActiveDepositors = INT_ZERO;
    usageMetrics.dailyActiveBorrowers = INT_ZERO;
    usageMetrics.dailyActiveLiquidators = INT_ZERO;
    usageMetrics.dailyActiveLiquidatees = INT_ZERO;
    usageMetrics.dailyActiveUsers = INT_ZERO;

    usageMetrics.dailyCollateralIn = INT_ZERO;
    usageMetrics.dailyCollateralOut = INT_ZERO;
  }

  usageMetrics.longPositionCount = protocol.longPositionCount;
  usageMetrics.shortPositionCount = protocol.shortPositionCount;
  usageMetrics.openPositionCount = protocol.openPositionCount;
  usageMetrics.closedPositionCount = protocol.closedPositionCount;
  usageMetrics.cumulativePositionCount = protocol.cumulativePositionCount;

  usageMetrics.cumulativeUniqueDepositors =
    protocol._cumulativeUniqueDepositors;
  usageMetrics.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
  usageMetrics.cumulativeUniqueLiquidators =
    protocol.cumulativeUniqueLiquidators;
  usageMetrics.cumulativeUniqueLiquidatees =
    protocol.cumulativeUniqueLiquidatees;
  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetrics.cumulativeCollateralIn = protocol.collateralInCount;
  usageMetrics.cumulativeCollateralOut = protocol.collateralOutCount;

  usageMetrics.totalPoolCount = protocol.totalPoolCount;

  usageMetrics.save();
}

export function takeUsageMetricsHourlySnapshot(
  protocol: DerivPerpProtocol,
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

  let tempUsageMetrics = _TempUsageMetricsHourlySnapshot.load(id);
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

    usageMetrics.dailylongPositionCount = INT_ZERO;
    usageMetrics.dailyshortPositionCount = INT_ZERO;
    usageMetrics.dailyopenPositionCount = INT_ZERO;
    usageMetrics.dailyclosedPositionCount = INT_ZERO;
    usageMetrics.dailycumulativePositionCount = INT_ZERO;

    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.dailyActiveDepositors = INT_ZERO;
    usageMetrics.dailyActiveBorrowers = INT_ZERO;
    usageMetrics.dailyActiveLiquidators = INT_ZERO;
    usageMetrics.dailyActiveLiquidatees = INT_ZERO;
    usageMetrics.dailyActiveUsers = INT_ZERO;

    usageMetrics.dailyCollateralIn = INT_ZERO;
    usageMetrics.dailyCollateralOut = INT_ZERO;

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
  eventType: EventType,
  openPositionCount: i32,
  positionSide: string | null
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
        usageMetricsDaily.dailyActiveDepositors += INT_ONE;
      }
      break;
    case EventType.Withdraw:
      usageMetricsDaily.dailyWithdrawCount += INT_ONE;
      usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
      break;
    case EventType.CollateralIn:
      usageMetricsDaily.dailyCollateralIn += INT_ONE;
      usageMetricsDaily.dailyBorrowCount += INT_ONE;
      if (isUniqueDailyUser(event, fromAddress, eventType)) {
        usageMetricsDaily.dailyActiveBorrowers += INT_ONE;
      }
      break;
    case EventType.CollateralOut:
      usageMetricsDaily.dailyCollateralOut += INT_ONE;
      break;
    case EventType.Swap:
      usageMetricsDaily.dailySwapCount += INT_ONE;
      usageMetricsHourly.hourlySwapCount += INT_ONE;
      break;
    case EventType.Liquidate:
      if (isUniqueDailyUser(event, fromAddress, eventType)) {
        usageMetricsDaily.dailyActiveLiquidators += INT_ONE;
      }
      break;
    case EventType.Liquidated:
      if (isUniqueDailyUser(event, fromAddress, eventType)) {
        usageMetricsDaily.dailyActiveLiquidatees += INT_ONE;
      }
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

  if (openPositionCount > INT_ZERO) {
    if (PositionSide.LONG == positionSide) {
      usageMetricsDaily.dailylongPositionCount += INT_ONE;
    } else {
      usageMetricsDaily.dailyshortPositionCount += INT_ONE;
    }
    usageMetricsDaily.dailyopenPositionCount += INT_ONE;
    usageMetricsDaily.dailycumulativePositionCount += INT_ONE;
  } else if (openPositionCount < INT_ZERO) {
    usageMetricsDaily.dailyclosedPositionCount += INT_ONE;
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

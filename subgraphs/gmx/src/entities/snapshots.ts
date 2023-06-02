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
  BIGINT_ZERO,
} from "../utils/constants";

// snapshots are only snapped once per interval for efficiency.
export function takeSnapshots(event: ethereum.Event): void {
  const dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hourID = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const protocol = getOrCreateProtocol();
  const protocolSnapshotDayID =
    protocol._lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
  const protocolSnapshotHourID =
    protocol._lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;

  if (protocolSnapshotDayID != dayID && protocolSnapshotDayID != INT_ZERO) {
    takeFinancialDailySnapshot(event, protocol, protocolSnapshotDayID);
    takeUsageMetricsDailySnapshot(event, protocol, protocolSnapshotDayID);
    updateProtocolSnapshotDayID(protocolSnapshotDayID);
  }
  if (protocolSnapshotHourID != hourID && protocolSnapshotHourID != INT_ZERO) {
    takeUsageMetricsHourlySnapshot(event, protocol, protocolSnapshotHourID);
  }

  const pool = getOrCreateLiquidityPool(event);
  const poolSnapshotDayID =
    pool._lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
  const poolSnapshotHourID =
    pool._lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;
  if (poolSnapshotDayID != dayID && poolSnapshotDayID != INT_ZERO) {
    takeLiquidityPoolDailySnapshot(event, pool, poolSnapshotDayID);
    updatePoolSnapshotDayID(event, poolSnapshotDayID);
  }
  if (poolSnapshotHourID != hourID && poolSnapshotHourID != INT_ZERO) {
    takeLiquidityPoolHourlySnapshot(event, pool, poolSnapshotHourID);
    updatePoolSnapshotHourID(event, poolSnapshotHourID);
  }
}

export function takeLiquidityPoolDailySnapshot(
  event: ethereum.Event,
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

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevInputTokens: Bytes[] = [];
  let prevCumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeInflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeInflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeOutflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeOutflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeClosedInflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeClosedInflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);

  let prevCumulativeUniqueUsers = INT_ZERO;
  let prevCumulativeUniqueDepositors = INT_ZERO;
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

    prevInputTokens = prevPoolMetrics._inputTokens;
    prevCumulativeInflowVolumeUSD = prevPoolMetrics.cumulativeInflowVolumeUSD;
    prevCumulativeClosedInflowVolumeUSD =
      prevPoolMetrics.cumulativeClosedInflowVolumeUSD;
    prevCumulativeOutflowVolumeUSD = prevPoolMetrics.cumulativeOutflowVolumeUSD;
    prevCumulativeVolumeByTokenAmount =
      prevPoolMetrics._cumulativeVolumeByTokenAmount;
    prevCumulativeVolumeByTokenUSD =
      prevPoolMetrics._cumulativeVolumeByTokenUSD;
    prevCumulativeInflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeInflowVolumeByTokenAmount;
    prevCumulativeInflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeInflowVolumeByTokenUSD;
    prevCumulativeOutflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeOutflowVolumeByTokenAmount;
    prevCumulativeOutflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeOutflowVolumeByTokenUSD;
    prevCumulativeClosedInflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeClosedInflowVolumeByTokenAmount;
    prevCumulativeClosedInflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeClosedInflowVolumeByTokenUSD;

    prevCumulativeUniqueUsers = prevPoolMetrics._cumulativeUniqueUsers;
    prevCumulativeUniqueDepositors =
      prevPoolMetrics._cumulativeUniqueDepositors;
    prevCumulativeUniqueBorrowers = prevPoolMetrics.cumulativeUniqueBorrowers;
    prevCumulativeUniqueLiquidators =
      prevPoolMetrics.cumulativeUniqueLiquidators;
    prevCumulativeUniqueLiquidatees =
      prevPoolMetrics.cumulativeUniqueLiquidatees;

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
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.dailyLongOpenInterestUSD = pool.longOpenInterestUSD;
  poolMetrics.dailyShortOpenInterestUSD = pool.shortOpenInterestUSD;
  poolMetrics.dailyTotalOpenInterestUSD = pool.totalOpenInterestUSD;

  poolMetrics._inputTokens = pool.inputTokens;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.inputTokenWeights = pool.inputTokenWeights;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetrics.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetrics.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;

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

  poolMetrics.dailyFundingrate = pool.fundingrate;
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
  poolMetrics.dailyInflowVolumeUSD = pool.cumulativeInflowVolumeUSD.minus(
    prevCumulativeInflowVolumeUSD
  );
  poolMetrics.cumulativeInflowVolumeUSD = pool.cumulativeInflowVolumeUSD;
  poolMetrics.dailyClosedInflowVolumeUSD =
    pool.cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  poolMetrics.cumulativeClosedInflowVolumeUSD =
    pool.cumulativeClosedInflowVolumeUSD;
  poolMetrics.dailyOutflowVolumeUSD = pool.cumulativeOutflowVolumeUSD.minus(
    prevCumulativeOutflowVolumeUSD
  );
  poolMetrics.cumulativeOutflowVolumeUSD = pool.cumulativeOutflowVolumeUSD;
  poolMetrics._cumulativeVolumeByTokenAmount =
    pool._cumulativeVolumeByTokenAmount;
  poolMetrics._cumulativeVolumeByTokenUSD = pool._cumulativeVolumeByTokenUSD;
  poolMetrics._cumulativeInflowVolumeByTokenAmount =
    pool._cumulativeInflowVolumeByTokenAmount;
  poolMetrics._cumulativeInflowVolumeByTokenUSD =
    pool._cumulativeInflowVolumeByTokenUSD;
  poolMetrics._cumulativeOutflowVolumeByTokenAmount =
    pool._cumulativeOutflowVolumeByTokenAmount;
  poolMetrics._cumulativeOutflowVolumeByTokenUSD =
    pool._cumulativeOutflowVolumeByTokenUSD;
  poolMetrics._cumulativeClosedInflowVolumeByTokenAmount =
    pool._cumulativeClosedInflowVolumeByTokenAmount;
  poolMetrics._cumulativeClosedInflowVolumeByTokenUSD =
    pool._cumulativeClosedInflowVolumeByTokenUSD;
  const dailyVolumeByTokenAmount = pool._cumulativeVolumeByTokenAmount;
  const dailyVolumeByTokenUSD = pool._cumulativeVolumeByTokenUSD;
  const dailyInflowVolumeByTokenAmount =
    pool._cumulativeInflowVolumeByTokenAmount;
  const dailyInflowVolumeByTokenUSD = pool._cumulativeInflowVolumeByTokenUSD;
  const dailyClosedInflowVolumeByTokenAmount =
    pool._cumulativeClosedInflowVolumeByTokenAmount;
  const dailyClosedInflowVolumeByTokenUSD =
    pool._cumulativeClosedInflowVolumeByTokenUSD;
  const dailyOutflowVolumeByTokenAmount =
    pool._cumulativeOutflowVolumeByTokenAmount;
  const dailyOutflowVolumeByTokenUSD = pool._cumulativeOutflowVolumeByTokenUSD;

  for (let i = 0; i < inputTokenLength; i++) {
    for (let j = 0; j < prevInputTokens.length; j++) {
      if (pool.inputTokens[i] == prevInputTokens[j]) {
        dailyVolumeByTokenAmount[i] = dailyVolumeByTokenAmount[i].minus(
          prevCumulativeVolumeByTokenAmount[j]
        );
        dailyVolumeByTokenUSD[i] = dailyVolumeByTokenUSD[i].minus(
          prevCumulativeVolumeByTokenUSD[j]
        );
        dailyInflowVolumeByTokenAmount[i] = dailyInflowVolumeByTokenAmount[
          i
        ].minus(prevCumulativeInflowVolumeByTokenAmount[j]);

        dailyInflowVolumeByTokenUSD[i] = dailyInflowVolumeByTokenUSD[i].minus(
          prevCumulativeInflowVolumeByTokenUSD[j]
        );
        dailyClosedInflowVolumeByTokenAmount[i] =
          dailyClosedInflowVolumeByTokenAmount[i].minus(
            prevCumulativeClosedInflowVolumeByTokenAmount[j]
          );
        dailyClosedInflowVolumeByTokenUSD[i] =
          dailyClosedInflowVolumeByTokenUSD[i].minus(
            prevCumulativeClosedInflowVolumeByTokenUSD[j]
          );
        dailyOutflowVolumeByTokenAmount[i] = dailyOutflowVolumeByTokenAmount[
          i
        ].minus(prevCumulativeOutflowVolumeByTokenAmount[j]);
        dailyOutflowVolumeByTokenUSD[i] = dailyOutflowVolumeByTokenUSD[i].minus(
          prevCumulativeOutflowVolumeByTokenUSD[j]
        );
      }
    }
  }

  poolMetrics.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  poolMetrics.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;
  poolMetrics.dailyInflowVolumeByTokenAmount = dailyInflowVolumeByTokenAmount;
  poolMetrics.dailyInflowVolumeByTokenUSD = dailyInflowVolumeByTokenUSD;
  poolMetrics.dailyClosedInflowVolumeByTokenAmount =
    dailyClosedInflowVolumeByTokenAmount;
  poolMetrics.dailyClosedInflowVolumeByTokenUSD =
    dailyClosedInflowVolumeByTokenUSD;
  poolMetrics.dailyOutflowVolumeByTokenAmount = dailyOutflowVolumeByTokenAmount;
  poolMetrics.dailyOutflowVolumeByTokenUSD = dailyOutflowVolumeByTokenUSD;

  poolMetrics.dailyActiveUsers =
    pool.cumulativeUniqueUsers - prevCumulativeUniqueUsers;
  poolMetrics._cumulativeUniqueUsers = pool.cumulativeUniqueUsers;
  poolMetrics.dailyActiveDepositors =
    pool.cumulativeUniqueDepositors - prevCumulativeUniqueDepositors;
  poolMetrics._cumulativeUniqueDepositors = pool.cumulativeUniqueDepositors;
  poolMetrics.dailyActiveBorrowers =
    pool.cumulativeUniqueBorrowers - prevCumulativeUniqueBorrowers;
  poolMetrics.cumulativeUniqueBorrowers = pool.cumulativeUniqueBorrowers;
  poolMetrics.dailyActiveLiquidators =
    pool.cumulativeUniqueLiquidators - prevCumulativeUniqueLiquidators;
  poolMetrics.cumulativeUniqueLiquidators = pool.cumulativeUniqueLiquidators;
  poolMetrics.dailyActiveLiquidatees =
    pool.cumulativeUniqueLiquidatees - prevCumulativeUniqueLiquidatees;
  poolMetrics.cumulativeUniqueLiquidatees = pool.cumulativeUniqueLiquidatees;

  poolMetrics.dailyLongPositionCount =
    pool.longPositionCount - prevLongPositionCount >= 0
      ? pool.longPositionCount - prevLongPositionCount
      : INT_ZERO;
  poolMetrics.longPositionCount = pool.longPositionCount;
  poolMetrics.dailyShortPositionCount =
    pool.shortPositionCount - prevShortPositionCount >= 0
      ? pool.shortPositionCount - prevShortPositionCount
      : INT_ZERO;
  poolMetrics.shortPositionCount = pool.shortPositionCount;
  poolMetrics.dailyOpenPositionCount =
    pool.openPositionCount - prevOpenPositionCount >= 0
      ? pool.openPositionCount - prevOpenPositionCount
      : INT_ZERO;
  poolMetrics.openPositionCount = pool.openPositionCount;
  poolMetrics.dailyClosedPositionCount =
    pool.closedPositionCount - prevClosedPositionCount;
  poolMetrics.closedPositionCount = pool.closedPositionCount;
  poolMetrics.dailyCumulativePositionCount =
    pool.cumulativePositionCount - prevCumulativePositionCount;
  poolMetrics.cumulativePositionCount = pool.cumulativePositionCount;

  poolMetrics.save();
}

export function takeLiquidityPoolHourlySnapshot(
  event: ethereum.Event,
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

  let prevCumulativeVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  let prevCumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

  let prevCumulativeEntryPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeExitPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeDepositPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeWithdrawPremiumUSD = BIGDECIMAL_ZERO;
  let prevCumulativeTotalLiquidityPremiumUSD = BIGDECIMAL_ZERO;

  let prevInputTokens: Bytes[] = [];
  let prevCumulativeInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeClosedInflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeOutflowVolumeUSD = BIGDECIMAL_ZERO;
  let prevCumulativeVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeInflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeInflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeOutflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeOutflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);
  let prevCumulativeClosedInflowVolumeByTokenAmount = new Array<BigInt>(
    inputTokenLength
  ).fill(BIGINT_ZERO);
  let prevCumulativeClosedInflowVolumeByTokenUSD = new Array<BigDecimal>(
    inputTokenLength
  ).fill(BIGDECIMAL_ZERO);

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

    prevInputTokens = prevPoolMetrics._inputTokens;
    prevCumulativeInflowVolumeUSD = prevPoolMetrics.cumulativeInflowVolumeUSD;
    prevCumulativeClosedInflowVolumeUSD =
      prevPoolMetrics.cumulativeClosedInflowVolumeUSD;
    prevCumulativeOutflowVolumeUSD = prevPoolMetrics.cumulativeOutflowVolumeUSD;
    prevCumulativeVolumeByTokenAmount =
      prevPoolMetrics._cumulativeVolumeByTokenAmount;
    prevCumulativeVolumeByTokenUSD =
      prevPoolMetrics._cumulativeVolumeByTokenUSD;
    prevCumulativeInflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeInflowVolumeByTokenAmount;
    prevCumulativeInflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeInflowVolumeByTokenUSD;
    prevCumulativeOutflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeOutflowVolumeByTokenAmount;
    prevCumulativeOutflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeOutflowVolumeByTokenUSD;
    prevCumulativeClosedInflowVolumeByTokenAmount =
      prevPoolMetrics._cumulativeClosedInflowVolumeByTokenAmount;
    prevCumulativeClosedInflowVolumeByTokenUSD =
      prevPoolMetrics._cumulativeClosedInflowVolumeByTokenUSD;
  } else if (pool._lastSnapshotHourID > INT_ZERO) {
    log.error(
      "Missing hourly pool snapshot at ID that has been snapped: Pool {}, ID {} ",
      [pool.id.toHexString(), pool._lastSnapshotHourID.toString()]
    );
  }

  poolMetrics.hours = hour;
  poolMetrics.protocol = pool.protocol;
  poolMetrics.pool = pool.id;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.hourlyLongOpenInterestUSD = pool.longOpenInterestUSD;
  poolMetrics.hourlyShortOpenInterestUSD = pool.shortOpenInterestUSD;
  poolMetrics.hourlyTotalOpenInterestUSD = pool.totalOpenInterestUSD;

  poolMetrics._inputTokens = pool.inputTokens;
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

  poolMetrics.hourlyFundingrate = pool.fundingrate;
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
  poolMetrics.hourlyInflowVolumeUSD = pool.cumulativeInflowVolumeUSD.minus(
    prevCumulativeInflowVolumeUSD
  );
  poolMetrics.cumulativeInflowVolumeUSD = pool.cumulativeInflowVolumeUSD;
  poolMetrics.hourlyClosedInflowVolumeUSD =
    pool.cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  poolMetrics.cumulativeClosedInflowVolumeUSD =
    pool.cumulativeClosedInflowVolumeUSD;
  poolMetrics.hourlyOutflowVolumeUSD = pool.cumulativeOutflowVolumeUSD.minus(
    prevCumulativeOutflowVolumeUSD
  );
  poolMetrics.cumulativeOutflowVolumeUSD = pool.cumulativeOutflowVolumeUSD;
  poolMetrics._cumulativeVolumeByTokenAmount =
    pool._cumulativeVolumeByTokenAmount;
  poolMetrics._cumulativeVolumeByTokenUSD = pool._cumulativeVolumeByTokenUSD;
  poolMetrics._cumulativeInflowVolumeByTokenAmount =
    pool._cumulativeInflowVolumeByTokenAmount;
  poolMetrics._cumulativeInflowVolumeByTokenUSD =
    pool._cumulativeInflowVolumeByTokenUSD;
  poolMetrics._cumulativeOutflowVolumeByTokenAmount =
    pool._cumulativeOutflowVolumeByTokenAmount;
  poolMetrics._cumulativeOutflowVolumeByTokenUSD =
    pool._cumulativeOutflowVolumeByTokenUSD;
  poolMetrics._cumulativeClosedInflowVolumeByTokenAmount =
    pool._cumulativeClosedInflowVolumeByTokenAmount;
  poolMetrics._cumulativeClosedInflowVolumeByTokenUSD =
    pool._cumulativeClosedInflowVolumeByTokenUSD;
  const hourlyVolumeByTokenAmount = pool._cumulativeVolumeByTokenAmount;
  const hourlyVolumeByTokenUSD = pool._cumulativeVolumeByTokenUSD;
  const hourlyInflowVolumeByTokenAmount =
    pool._cumulativeInflowVolumeByTokenAmount;
  const hourlyInflowVolumeByTokenUSD = pool._cumulativeInflowVolumeByTokenUSD;
  const hourlyClosedInflowVolumeByTokenAmount =
    pool._cumulativeClosedInflowVolumeByTokenAmount;
  const hourlyClosedInflowVolumeByTokenUSD =
    pool._cumulativeClosedInflowVolumeByTokenUSD;
  const hourlyOutflowVolumeByTokenAmount =
    pool._cumulativeOutflowVolumeByTokenAmount;
  const hourlyOutflowVolumeByTokenUSD = pool._cumulativeOutflowVolumeByTokenUSD;

  for (let i = 0; i < inputTokenLength; i++) {
    for (let j = 0; j < prevInputTokens.length; j++) {
      if (pool.inputTokens[i] == prevInputTokens[j]) {
        hourlyVolumeByTokenAmount[i] = hourlyVolumeByTokenAmount[i].minus(
          prevCumulativeVolumeByTokenAmount[j]
        );
        hourlyVolumeByTokenUSD[i] = hourlyVolumeByTokenUSD[i].minus(
          prevCumulativeVolumeByTokenUSD[j]
        );
        hourlyInflowVolumeByTokenAmount[i] = hourlyInflowVolumeByTokenAmount[
          i
        ].minus(prevCumulativeInflowVolumeByTokenAmount[j]);
        hourlyInflowVolumeByTokenUSD[i] = hourlyInflowVolumeByTokenUSD[i].minus(
          prevCumulativeInflowVolumeByTokenUSD[j]
        );
        hourlyClosedInflowVolumeByTokenAmount[i] =
          hourlyClosedInflowVolumeByTokenAmount[i].minus(
            prevCumulativeClosedInflowVolumeByTokenAmount[j]
          );
        hourlyClosedInflowVolumeByTokenUSD[i] =
          hourlyClosedInflowVolumeByTokenUSD[i].minus(
            prevCumulativeClosedInflowVolumeByTokenUSD[j]
          );
        hourlyOutflowVolumeByTokenAmount[i] = hourlyOutflowVolumeByTokenAmount[
          i
        ].minus(prevCumulativeOutflowVolumeByTokenAmount[j]);
        hourlyOutflowVolumeByTokenUSD[i] = hourlyOutflowVolumeByTokenUSD[
          i
        ].minus(prevCumulativeOutflowVolumeByTokenUSD[j]);
      }
    }
  }
  poolMetrics.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  poolMetrics.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;
  poolMetrics.hourlyInflowVolumeByTokenAmount = hourlyInflowVolumeByTokenAmount;
  poolMetrics.hourlyInflowVolumeByTokenUSD = hourlyInflowVolumeByTokenUSD;
  poolMetrics.hourlyClosedInflowVolumeByTokenAmount =
    hourlyClosedInflowVolumeByTokenAmount;
  poolMetrics.hourlyClosedInflowVolumeByTokenUSD =
    hourlyClosedInflowVolumeByTokenUSD;
  poolMetrics.hourlyOutflowVolumeByTokenAmount =
    hourlyOutflowVolumeByTokenAmount;
  poolMetrics.hourlyOutflowVolumeByTokenUSD = hourlyOutflowVolumeByTokenUSD;

  poolMetrics.save();
}

export function takeFinancialDailySnapshot(
  event: ethereum.Event,
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

  if (prevFinancialMetrics) {
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
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.protocolControlledValueUSD =
    protocol.protocolControlledValueUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;
  financialMetrics.dailyVolumeUSD = protocol.cumulativeVolumeUSD.minus(
    prevCumulativeVolumeUSD
  );
  financialMetrics.cumulativeInflowVolumeUSD =
    protocol.cumulativeInflowVolumeUSD;
  financialMetrics.dailyInflowVolumeUSD =
    protocol.cumulativeInflowVolumeUSD.minus(prevCumulativeInflowVolumeUSD);
  financialMetrics.cumulativeClosedInflowVolumeUSD =
    protocol.cumulativeClosedInflowVolumeUSD;
  financialMetrics.dailyClosedInflowVolumeUSD =
    protocol.cumulativeClosedInflowVolumeUSD.minus(
      prevCumulativeClosedInflowVolumeUSD
    );
  financialMetrics.cumulativeOutflowVolumeUSD =
    protocol.cumulativeOutflowVolumeUSD;
  financialMetrics.dailyOutflowVolumeUSD =
    protocol.cumulativeOutflowVolumeUSD.minus(prevCumulativeOutflowVolumeUSD);
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
  financialMetrics.dailyLongOpenInterestUSD = protocol.longOpenInterestUSD;
  financialMetrics.dailyShortOpenInterestUSD = protocol.shortOpenInterestUSD;
  financialMetrics.dailyTotalOpenInterestUSD = protocol.totalOpenInterestUSD;

  financialMetrics.save();
}

export function takeUsageMetricsDailySnapshot(
  event: ethereum.Event,
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
  usageMetrics.timestamp = event.block.timestamp;

  const tempUsageMetrics = _TempUsageMetricsDailySnapshot.load(id);
  if (tempUsageMetrics) {
    usageMetrics.dailyLongPositionCount =
      tempUsageMetrics.dailyLongPositionCount;
    usageMetrics.dailyShortPositionCount =
      tempUsageMetrics.dailyShortPositionCount;
    usageMetrics.dailyOpenPositionCount =
      tempUsageMetrics.dailyOpenPositionCount;
    usageMetrics.dailyClosedPositionCount =
      tempUsageMetrics.dailyClosedPositionCount;
    usageMetrics.dailyCumulativePositionCount =
      tempUsageMetrics.dailyCumulativePositionCount;

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
    usageMetrics.dailyLongPositionCount = INT_ZERO;
    usageMetrics.dailyShortPositionCount = INT_ZERO;
    usageMetrics.dailyOpenPositionCount = INT_ZERO;
    usageMetrics.dailyClosedPositionCount = INT_ZERO;
    usageMetrics.dailyCumulativePositionCount = INT_ZERO;

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

  usageMetrics.cumulativeUniqueDepositors = protocol.cumulativeUniqueDepositors;
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
  event: ethereum.Event,
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
  usageMetrics.timestamp = event.block.timestamp;

  const tempUsageMetrics = _TempUsageMetricsHourlySnapshot.load(id);
  if (tempUsageMetrics) {
    usageMetrics.hourlyActiveUsers = tempUsageMetrics.hourlyActiveUsers;
    usageMetrics.hourlyTransactionCount =
      tempUsageMetrics.hourlyTransactionCount;
    usageMetrics.hourlyDepositCount = tempUsageMetrics.hourlyDepositCount;
    usageMetrics.hourlyWithdrawCount = tempUsageMetrics.hourlyWithdrawCount;
    usageMetrics.hourlySwapCount = tempUsageMetrics.hourlySwapCount;
    usageMetrics.hourlyBorrowCount = tempUsageMetrics.hourlyBorrowCount;
  } else {
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
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

    usageMetrics.dailyLongPositionCount = INT_ZERO;
    usageMetrics.dailyShortPositionCount = INT_ZERO;
    usageMetrics.dailyOpenPositionCount = INT_ZERO;
    usageMetrics.dailyClosedPositionCount = INT_ZERO;
    usageMetrics.dailyCumulativePositionCount = INT_ZERO;

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
    usageMetrics.hourlyBorrowCount = INT_ZERO;

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
      usageMetricsHourly.hourlyBorrowCount += INT_ONE;
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
      usageMetricsDaily.dailyLongPositionCount += INT_ONE;
    } else {
      usageMetricsDaily.dailyShortPositionCount += INT_ONE;
    }
    usageMetricsDaily.dailyOpenPositionCount += INT_ONE;
    usageMetricsDaily.dailyCumulativePositionCount += INT_ONE;
  } else if (openPositionCount < INT_ZERO) {
    usageMetricsDaily.dailyClosedPositionCount += INT_ONE;
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

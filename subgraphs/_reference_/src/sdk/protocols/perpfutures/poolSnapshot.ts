import {
  _VolumeDailyTracker,
  _VolumeHourlyTracker,
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPool as PoolSchema,
} from "../../../../generated/schema";
import * as constants from "../../util/constants";
import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

export class PoolSnapshot {
  pool: PoolSchema;
  event: CustomEventType;
  dayID: i32;
  hourID: i32;

  constructor(pool: PoolSchema, event: CustomEventType) {
    this.pool = pool;
    this.event = event;
    this.dayID = getUnixDays(event.block);
    this.hourID = getUnixHours(event.block);
    this.takeSnapshots();
  }

  private takeSnapshots(): void {
    if (!this.isInitialized()) return;
    if (!this.pool._lastUpdateTimestamp) return;

    const snapshotDayID =
      this.pool._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_DAY;
    const snapshotHourID =
      this.pool._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_HOUR;

    if (snapshotDayID != this.dayID) {
      this.takeDailySnapshot(snapshotDayID);
      this.pool._lastSnapshotDayID = snapshotDayID;
      this.pool.save();
    }

    if (snapshotHourID != this.hourID) {
      this.takeHourlySnapshot(snapshotHourID);
      this.pool._lastSnapshotHourID = snapshotHourID;
      this.pool.save();
    }
  }

  private isInitialized(): boolean {
    return !!(this.pool._lastSnapshotDayID && this.pool._lastSnapshotHourID);
  }

  private takeHourlySnapshot(hour: i32): void {
    const snapshot = new LiquidityPoolHourlySnapshot(
      this.pool.id.concatI32(hour)
    );

    const previousSnapshot = LiquidityPoolHourlySnapshot.load(
      this.pool.id.concatI32(this.pool._lastSnapshotHourID)
    );
    const volumeTracker = getOrCreateVolumeHourlyTracker(hour, this.pool);

    snapshot.hours = hour;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.hourlySupplySideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        )
      : snapshot.cumulativeSupplySideRevenueUSD;

    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.hourlyProtocolSideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        )
      : snapshot.cumulativeProtocolSideRevenueUSD;

    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    snapshot.hourlyTotalRevenueUSD = previousSnapshot
      ? snapshot.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        )
      : snapshot.cumulativeTotalRevenueUSD;

    snapshot.hourlyFundingrate = this.pool.fundingrate;
    snapshot.hourlyOpenInterestUSD = this.pool.openInterestUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.hourlyEntryPremiumUSD = previousSnapshot
      ? snapshot.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        )
      : snapshot.cumulativeEntryPremiumUSD;

    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.hourlyExitPremiumUSD = previousSnapshot
      ? snapshot.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        )
      : snapshot.cumulativeExitPremiumUSD;

    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;
    snapshot.hourlyTotalPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        )
      : snapshot.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.hourlyDepositPremiumUSD = previousSnapshot
      ? snapshot.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        )
      : snapshot.cumulativeDepositPremiumUSD;

    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.hourlyWithdrawPremiumUSD = previousSnapshot
      ? snapshot.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        )
      : snapshot.cumulativeWithdrawPremiumUSD;

    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;
    snapshot.hourlyTotalLiquidityPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        )
      : snapshot.cumulativeTotalLiquidityPremiumUSD;

    snapshot.hourlyVolumeByTokenUSD = volumeTracker.hourlyVolumeByTokenUSD;
    snapshot.hourlyVolumeByTokenAmount =
      volumeTracker.hourlyVolumeByTokenAmount;

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.hourlyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.hourlyInflowVolumeByTokenUSD =
      volumeTracker.hourlyInflowVolumeByTokenUSD;
    snapshot.hourlyInflowVolumeByTokenAmount =
      volumeTracker.hourlyInflowVolumeByTokenAmount;

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.hourlyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.hourlyClosedInflowVolumeByTokenUSD =
      volumeTracker.hourlyClosedInflowVolumeByTokenUSD;
    snapshot.hourlyClosedInflowVolumeByTokenAmount =
      volumeTracker.hourlyClosedInflowVolumeByTokenAmount;

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.hourlyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.hourlyOutflowVolumeByTokenUSD =
      volumeTracker.hourlyOutflowVolumeByTokenUSD;
    snapshot.hourlyOutflowVolumeByTokenAmount =
      volumeTracker.hourlyOutflowVolumeByTokenAmount;

    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;
    snapshot.hourlyOutflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        )
      : snapshot.cumulativeOutflowVolumeUSD;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    snapshot.save();
  }

  private takeDailySnapshot(day: i32): void {
    const snapshot = new LiquidityPoolDailySnapshot(
      this.pool.id.concatI32(day)
    );
    const previousSnapshot = LiquidityPoolDailySnapshot.load(
      this.pool.id.concatI32(this.pool._lastSnapshotDayID)
    );
    const volumeTracker = getOrCreateVolumeDailyTracker(day, this.pool);

    snapshot.days = day;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.dailySupplySideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        )
      : snapshot.cumulativeSupplySideRevenueUSD;

    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.dailyProtocolSideRevenueUSD = previousSnapshot
      ? snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        )
      : snapshot.cumulativeProtocolSideRevenueUSD;

    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;
    snapshot.dailyTotalRevenueUSD = previousSnapshot
      ? snapshot.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        )
      : snapshot.cumulativeTotalRevenueUSD;

    snapshot.dailyFundingrate = this.pool.fundingrate;
    snapshot.dailyOpenInterestUSD = this.pool.openInterestUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.dailyEntryPremiumUSD = previousSnapshot
      ? snapshot.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        )
      : snapshot.cumulativeEntryPremiumUSD;

    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.dailyExitPremiumUSD = previousSnapshot
      ? snapshot.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        )
      : snapshot.cumulativeExitPremiumUSD;

    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;
    snapshot.dailyTotalPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        )
      : snapshot.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.dailyDepositPremiumUSD = previousSnapshot
      ? snapshot.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        )
      : snapshot.cumulativeDepositPremiumUSD;

    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.dailyWithdrawPremiumUSD = previousSnapshot
      ? snapshot.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        )
      : snapshot.cumulativeWithdrawPremiumUSD;

    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;
    snapshot.dailyTotalLiquidityPremiumUSD = previousSnapshot
      ? snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        )
      : snapshot.cumulativeTotalLiquidityPremiumUSD;

    snapshot.dailyVolumeByTokenUSD = volumeTracker.dailyVolumeByTokenUSD;
    snapshot.dailyVolumeByTokenAmount = volumeTracker.dailyVolumeByTokenAmount;

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.dailyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.dailyInflowVolumeByTokenUSD =
      volumeTracker.dailyInflowVolumeByTokenUSD;
    snapshot.dailyInflowVolumeByTokenAmount =
      volumeTracker.dailyInflowVolumeByTokenAmount;

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.dailyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.dailyClosedInflowVolumeByTokenUSD =
      volumeTracker.dailyClosedInflowVolumeByTokenUSD;
    snapshot.dailyClosedInflowVolumeByTokenAmount =
      volumeTracker.dailyClosedInflowVolumeByTokenAmount;

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.dailyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.dailyOutflowVolumeByTokenUSD =
      volumeTracker.dailyOutflowVolumeByTokenUSD;
    snapshot.dailyOutflowVolumeByTokenAmount =
      volumeTracker.dailyOutflowVolumeByTokenAmount;

    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;
    snapshot.dailyOutflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        )
      : snapshot.cumulativeOutflowVolumeUSD;

    snapshot.cumulativeUniqueBorrowers = this.pool.cumulativeUniqueBorrowers;
    snapshot.dailyActiveBorrowers = previousSnapshot
      ? snapshot.cumulativeUniqueBorrowers -
        previousSnapshot.cumulativeUniqueBorrowers
      : snapshot.cumulativeUniqueBorrowers;

    snapshot.cumulativeUniqueLiquidators =
      this.pool.cumulativeUniqueLiquidators;
    snapshot.dailyActiveLiquidators = previousSnapshot
      ? snapshot.cumulativeUniqueLiquidators -
        previousSnapshot.cumulativeUniqueLiquidators
      : snapshot.cumulativeUniqueLiquidators;

    snapshot.cumulativeUniqueLiquidatees =
      this.pool.cumulativeUniqueLiquidatees;
    snapshot.dailyActiveLiquidatees = previousSnapshot
      ? snapshot.cumulativeUniqueLiquidatees -
        previousSnapshot.cumulativeUniqueLiquidatees
      : snapshot.cumulativeUniqueLiquidatees;

    snapshot.longPositionCount = this.pool.longPositionCount;
    snapshot.dailyLongPositionCount = previousSnapshot
      ? snapshot.longPositionCount - previousSnapshot.longPositionCount
      : snapshot.longPositionCount;

    snapshot.shortPositionCount = this.pool.shortPositionCount;
    snapshot.dailyShortPositionCount = previousSnapshot
      ? snapshot.shortPositionCount - previousSnapshot.shortPositionCount
      : snapshot.shortPositionCount;

    snapshot.openPositionCount = this.pool.openPositionCount;
    snapshot.dailyOpenPositionCount = previousSnapshot
      ? snapshot.openPositionCount - previousSnapshot.openPositionCount
      : snapshot.openPositionCount;

    snapshot.closedPositionCount = this.pool.closedPositionCount;
    snapshot.dailyClosedPositionCount = previousSnapshot
      ? snapshot.closedPositionCount - previousSnapshot.closedPositionCount
      : snapshot.closedPositionCount;

    snapshot.cumulativePositionCount = this.pool.cumulativePositionCount;
    snapshot.dailyCumulativePositionCount = previousSnapshot
      ? snapshot.cumulativePositionCount -
        previousSnapshot.cumulativePositionCount
      : snapshot.cumulativePositionCount;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    snapshot.save();
  }

  getVolumeHourlyTracker(): _VolumeHourlyTracker {
    const hourID =
      this.pool._lastUpdateTimestamp!.toI32() / constants.SECONDS_PER_HOUR;

    return getOrCreateVolumeHourlyTracker(hourID, this.pool);
  }

  getVolumeDailyTracker(): _VolumeDailyTracker {
    const dayID =
      this.pool._lastUpdateTimestamp!.toI32() / constants.SECONDS_PER_DAY;

    return getOrCreateVolumeDailyTracker(dayID, this.pool);
  }
}

function getOrCreateVolumeHourlyTracker(
  hour: i32,
  pool: PoolSchema
): _VolumeHourlyTracker {
  let tracker = _VolumeHourlyTracker.load(pool.id.concatI32(hour));

  if (!tracker) {
    tracker = new _VolumeHourlyTracker(pool.id.concatI32(hour));
    tracker.hourlyVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.hourlyVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.hourlyInflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.hourlyInflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.hourlyClosedInflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.hourlyClosedInflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.hourlyOutflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.hourlyOutflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.save();
  }

  return tracker;
}

function getOrCreateVolumeDailyTracker(
  day: i32,
  pool: PoolSchema
): _VolumeDailyTracker {
  let tracker = _VolumeDailyTracker.load(pool.id.concatI32(day));

  if (!tracker) {
    tracker = new _VolumeDailyTracker(pool.id.concatI32(day));
    tracker.dailyVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.dailyVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.dailyInflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.dailyInflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.dailyClosedInflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.dailyClosedInflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.dailyOutflowVolumeByTokenAmount = new Array<BigInt>(
      pool.inputTokens.length
    ).fill(constants.BIGINT_ZERO);
    tracker.dailyOutflowVolumeByTokenUSD = new Array<BigDecimal>(
      pool.inputTokens.length
    ).fill(constants.BIGDECIMAL_ZERO);

    tracker.save();
  }

  return tracker;
}

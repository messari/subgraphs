import {
  LiquidityPoolDailySnapshot,
  LiquidityPoolHourlySnapshot,
  LiquidityPool as PoolSchema,
} from "../../../../generated/schema";
import * as constants from "../../util/constants";
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

    snapshot.hours = hour;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    let volumeDelta = snapshot.cumulativeVolumeUSD;
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

    let entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD;
    let exitPremiumDelta = snapshot.cumulativeExitPremiumUSD;
    let totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD;

    let depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD;
    let withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD;
    let totalLiquidityPremiumDelta =
      snapshot.cumulativeTotalLiquidityPremiumUSD;

    let inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD;
    let outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD;
    let closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD;

    if (previousSnapshot) {
      volumeDelta = snapshot.cumulativeVolumeUSD.minus(
        previousSnapshot.cumulativeVolumeUSD
      );
      supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      );

      entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD.minus(
        previousSnapshot.cumulativeEntryPremiumUSD
      );
      exitPremiumDelta = snapshot.cumulativeExitPremiumUSD.minus(
        previousSnapshot.cumulativeExitPremiumUSD
      );
      totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD.minus(
        previousSnapshot.cumulativeTotalPremiumUSD
      );

      depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD.minus(
        previousSnapshot.cumulativeDepositPremiumUSD
      );
      withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD.minus(
        previousSnapshot.cumulativeWithdrawPremiumUSD
      );
      totalLiquidityPremiumDelta =
        snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        );

      inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD.minus(
        previousSnapshot.cumulativeInflowVolumeUSD
      );
      outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD.minus(
        previousSnapshot.cumulativeOutflowVolumeUSD
      );
      closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD.minus(
        previousSnapshot.cumulativeClosedInflowVolumeUSD
      );
    }

    snapshot.hourlySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.hourlyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.hourlyTotalRevenueUSD = totalRevenueDelta;

    snapshot.hourlyFundingrate = this.pool._fundingrate;
    snapshot.hourlyOpenInterestUSD = this.pool.openInterestUSD;

    snapshot.hourlyEntryPremiumUSD = entryPremiumDelta;
    snapshot.hourlyExitPremiumUSD = exitPremiumDelta;
    snapshot.hourlyTotalPremiumUSD = totalPremiumDelta;

    snapshot.hourlyDepositPremiumUSD = depositPremiumDelta;
    snapshot.hourlyWithdrawPremiumUSD = withdrawPremiumDelta;
    snapshot.hourlyTotalLiquidityPremiumUSD = totalLiquidityPremiumDelta;

    // TODO: Add logic for hourlyVolumeByTokenUSD
    snapshot.hourlyVolumeByTokenUSD = [];
    snapshot.hourlyVolumeByTokenAmount = [];
    snapshot.hourlyVolumeUSD = volumeDelta;

    snapshot.hourlyInflowVolumeUSD = inflowVolumeDelta;
    snapshot.hourlyInflowVolumeByTokenAmount;
    snapshot.hourlyInflowVolumeByTokenUSD;

    snapshot.hourlyClosedInflowVolumeByTokenUSD = [];
    snapshot.hourlyClosedInflowVolumeByTokenAmount = [];
    snapshot.hourlyClosedInflowVolumeUSD = closedInflowVolumeDelta;

    snapshot.hourlyOutflowVolumeByTokenUSD = [];
    snapshot.hourlyOutflowVolumeByTokenAmount = [];
    snapshot.hourlyOutflowVolumeUSD = outflowVolumeDelta;

    snapshot.save();
  }

  private takeDailySnapshot(day: i32): void {
    const snapshot = new LiquidityPoolDailySnapshot(
      this.pool.id.concatI32(day)
    );
    const previousSnapshot = LiquidityPoolDailySnapshot.load(
      this.pool.id.concatI32(this.pool._lastSnapshotDayID)
    );

    snapshot.days = day;
    snapshot.pool = this.pool.id;
    snapshot.protocol = this.pool.protocol;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.pool.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.pool.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = this.pool.cumulativeTotalRevenueUSD;

    snapshot.cumulativeEntryPremiumUSD = this.pool.cumulativeEntryPremiumUSD;
    snapshot.cumulativeExitPremiumUSD = this.pool.cumulativeExitPremiumUSD;
    snapshot.cumulativeTotalPremiumUSD = this.pool.cumulativeTotalPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.pool.cumulativeDepositPremiumUSD;
    snapshot.cumulativeWithdrawPremiumUSD =
      this.pool.cumulativeWithdrawPremiumUSD;
    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.pool.cumulativeTotalLiquidityPremiumUSD;

    snapshot.totalValueLockedUSD = this.pool.totalValueLockedUSD;
    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.cumulativeOutflowVolumeUSD = this.pool.cumulativeOutflowVolumeUSD;

    snapshot.inputTokenBalances = this.pool.inputTokenBalances;
    snapshot.inputTokenWeights = this.pool.inputTokenWeights;
    snapshot.outputTokenSupply = this.pool.outputTokenSupply;
    snapshot.outputTokenPriceUSD = this.pool.outputTokenPriceUSD;
    snapshot.stakedOutputTokenAmount = this.pool.stakedOutputTokenAmount;
    snapshot.rewardTokenEmissionsAmount = this.pool.rewardTokenEmissionsAmount;
    snapshot.rewardTokenEmissionsUSD = this.pool.rewardTokenEmissionsUSD;

    snapshot.cumulativeUniqueBorrowers = this.pool.cumulativeUniqueBorrowers;
    snapshot.cumulativeUniqueLiquidators =
      this.pool.cumulativeUniqueLiquidators;
    snapshot.cumulativeUniqueLiquidatees =
      this.pool.cumulativeUniqueLiquidatees;

    snapshot.longPositionCount = this.pool.longPositionCount;
    snapshot.shortPositionCount = this.pool.shortPositionCount;
    snapshot.openPositionCount = this.pool.openPositionCount;
    snapshot.closedPositionCount = this.pool.closedPositionCount;
    snapshot.cumulativePositionCount = this.pool.cumulativePositionCount;

    let volumeDelta = snapshot.cumulativeVolumeUSD;
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

    let entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD;
    let exitPremiumDelta = snapshot.cumulativeExitPremiumUSD;
    let totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD;

    let depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD;
    let withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD;
    let totalLiquidityPremiumDelta =
      snapshot.cumulativeTotalLiquidityPremiumUSD;

    let inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD;
    let outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD;
    let closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD;

    let uniqueBorrowersDelta = snapshot.cumulativeUniqueBorrowers;
    let uniqueLiquidatorsDelta = snapshot.cumulativeUniqueLiquidators;
    let uniqueLiquidateesDelta = snapshot.cumulativeUniqueLiquidatees;

    let longPositionCountDelta = snapshot.longPositionCount;
    let shortPositionCountDelta = snapshot.shortPositionCount;
    let openPositionCountDelta = snapshot.openPositionCount;
    let closedPositionCountDelta = snapshot.closedPositionCount;
    let positionCountDelta = snapshot.cumulativePositionCount;

    if (previousSnapshot) {
      volumeDelta = snapshot.cumulativeVolumeUSD.minus(
        previousSnapshot.cumulativeVolumeUSD
      );
      supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
        previousSnapshot.cumulativeSupplySideRevenueUSD
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD
      );

      entryPremiumDelta = snapshot.cumulativeEntryPremiumUSD.minus(
        previousSnapshot.cumulativeEntryPremiumUSD
      );
      exitPremiumDelta = snapshot.cumulativeExitPremiumUSD.minus(
        previousSnapshot.cumulativeExitPremiumUSD
      );
      totalPremiumDelta = snapshot.cumulativeTotalPremiumUSD.minus(
        previousSnapshot.cumulativeTotalPremiumUSD
      );

      depositPremiumDelta = snapshot.cumulativeDepositPremiumUSD.minus(
        previousSnapshot.cumulativeDepositPremiumUSD
      );
      withdrawPremiumDelta = snapshot.cumulativeWithdrawPremiumUSD.minus(
        previousSnapshot.cumulativeWithdrawPremiumUSD
      );
      totalLiquidityPremiumDelta =
        snapshot.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        );

      inflowVolumeDelta = snapshot.cumulativeInflowVolumeUSD.minus(
        previousSnapshot.cumulativeInflowVolumeUSD
      );
      outflowVolumeDelta = snapshot.cumulativeOutflowVolumeUSD.minus(
        previousSnapshot.cumulativeOutflowVolumeUSD
      );
      closedInflowVolumeDelta = snapshot.cumulativeClosedInflowVolumeUSD.minus(
        previousSnapshot.cumulativeClosedInflowVolumeUSD
      );

      uniqueBorrowersDelta =
        snapshot.cumulativeUniqueBorrowers -
        previousSnapshot.cumulativeUniqueBorrowers;
      uniqueLiquidatorsDelta =
        snapshot.cumulativeUniqueLiquidators -
        previousSnapshot.cumulativeUniqueLiquidators;
      uniqueLiquidateesDelta =
        snapshot.cumulativeUniqueLiquidatees -
        previousSnapshot.cumulativeUniqueLiquidatees;

      longPositionCountDelta =
        snapshot.longPositionCount - previousSnapshot.longPositionCount;
      shortPositionCountDelta =
        snapshot.shortPositionCount - previousSnapshot.shortPositionCount;
      openPositionCountDelta =
        snapshot.openPositionCount - previousSnapshot.openPositionCount;
      closedPositionCountDelta =
        snapshot.closedPositionCount - previousSnapshot.closedPositionCount;
      positionCountDelta =
        snapshot.cumulativePositionCount -
        previousSnapshot.cumulativePositionCount;
    }

    snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.dailyTotalRevenueUSD = totalRevenueDelta;

    snapshot.dailyFundingrate = this.pool._fundingrate;
    snapshot.dailyOpenInterestUSD = this.pool.openInterestUSD;

    snapshot.dailyEntryPremiumUSD = entryPremiumDelta;
    snapshot.dailyExitPremiumUSD = exitPremiumDelta;
    snapshot.dailyTotalPremiumUSD = totalPremiumDelta;

    snapshot.dailyDepositPremiumUSD = depositPremiumDelta;
    snapshot.dailyWithdrawPremiumUSD = withdrawPremiumDelta;
    snapshot.dailyTotalLiquidityPremiumUSD = totalLiquidityPremiumDelta;

    snapshot.dailyVolumeByTokenUSD = [];
    snapshot.dailyVolumeByTokenAmount = [];
    snapshot.dailyVolumeUSD = volumeDelta;

    snapshot.dailyInflowVolumeUSD = inflowVolumeDelta;
    snapshot.dailyInflowVolumeByTokenAmount;
    snapshot.dailyInflowVolumeByTokenUSD;

    snapshot.dailyClosedInflowVolumeByTokenUSD = [];
    snapshot.dailyClosedInflowVolumeByTokenAmount = [];
    snapshot.dailyClosedInflowVolumeUSD = closedInflowVolumeDelta;

    snapshot.dailyOutflowVolumeByTokenUSD = [];
    snapshot.dailyOutflowVolumeByTokenAmount = [];
    snapshot.dailyOutflowVolumeUSD = outflowVolumeDelta;

    snapshot.dailyActiveBorrowers = uniqueBorrowersDelta;
    snapshot.dailyActiveLiquidators = uniqueLiquidatorsDelta;
    snapshot.dailyActiveLiquidatees = uniqueLiquidateesDelta;

    snapshot.dailylongPositionCount = longPositionCountDelta;
    snapshot.dailyshortPositionCount = shortPositionCountDelta;
    snapshot.dailyopenPositionCount = openPositionCountDelta;
    snapshot.dailyclosedPositionCount = closedPositionCountDelta;
    snapshot.dailycumulativePositionCount = positionCountDelta;

    snapshot.save();
  }
}

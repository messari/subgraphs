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

    snapshot.hourlyFundingrate = this.pool._fundingrate;
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

    snapshot.hourlyVolumeByTokenUSD = [];
    snapshot.hourlyVolumeByTokenAmount = [];

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.hourlyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.hourlyInflowVolumeByTokenUSD = [];
    snapshot.hourlyInflowVolumeByTokenAmount = [];

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.hourlyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.hourlyClosedInflowVolumeByTokenUSD = [];
    snapshot.hourlyClosedInflowVolumeByTokenAmount = [];

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.hourlyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.hourlyOutflowVolumeByTokenUSD = [];
    snapshot.hourlyOutflowVolumeByTokenAmount = [];

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

    snapshot.dailyFundingrate = this.pool._fundingrate;
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

    snapshot.dailyVolumeByTokenUSD = [];
    snapshot.dailyVolumeByTokenAmount = [];

    snapshot.cumulativeVolumeUSD = this.pool.cumulativeVolumeUSD;
    snapshot.dailyVolumeUSD = previousSnapshot
      ? snapshot.cumulativeVolumeUSD.minus(previousSnapshot.cumulativeVolumeUSD)
      : snapshot.cumulativeVolumeUSD;

    snapshot.dailyInflowVolumeByTokenUSD = [];
    snapshot.dailyInflowVolumeByTokenAmount = [];

    snapshot.cumulativeInflowVolumeUSD = this.pool.cumulativeInflowVolumeUSD;
    snapshot.dailyInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : snapshot.cumulativeInflowVolumeUSD;

    snapshot.dailyClosedInflowVolumeByTokenUSD = [];
    snapshot.dailyClosedInflowVolumeByTokenAmount = [];

    snapshot.cumulativeClosedInflowVolumeUSD =
      this.pool.cumulativeClosedInflowVolumeUSD;
    snapshot.dailyClosedInflowVolumeUSD = previousSnapshot
      ? snapshot.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : snapshot.cumulativeClosedInflowVolumeUSD;

    snapshot.dailyOutflowVolumeByTokenUSD = [];
    snapshot.dailyOutflowVolumeByTokenAmount = [];

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
    snapshot.dailylongPositionCount = previousSnapshot
      ? snapshot.longPositionCount - previousSnapshot.longPositionCount
      : snapshot.longPositionCount;

    snapshot.shortPositionCount = this.pool.shortPositionCount;
    snapshot.dailyshortPositionCount = previousSnapshot
      ? snapshot.shortPositionCount - previousSnapshot.shortPositionCount
      : snapshot.shortPositionCount;

    snapshot.openPositionCount = this.pool.openPositionCount;
    snapshot.dailyopenPositionCount = previousSnapshot
      ? snapshot.openPositionCount - previousSnapshot.openPositionCount
      : snapshot.openPositionCount;

    snapshot.closedPositionCount = this.pool.closedPositionCount;
    snapshot.dailyclosedPositionCount = previousSnapshot
      ? snapshot.closedPositionCount - previousSnapshot.closedPositionCount
      : snapshot.closedPositionCount;

    snapshot.cumulativePositionCount = this.pool.cumulativePositionCount;
    snapshot.dailycumulativePositionCount = previousSnapshot
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
}

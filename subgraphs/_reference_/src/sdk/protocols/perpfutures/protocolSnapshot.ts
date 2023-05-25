import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { TransactionType } from "./enums";
import { AccountWasActive } from "./account";
import * as constants from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

import {
  _ActivityHelper,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  DerivPerpProtocol as PerpetualSchema,
} from "../../../../generated/schema";

/**
 * This file contains the ProtocolSnapshot, which is used to
 * make all of the storage changes that occur in the protocol's
 * daily and hourly snapshots.
 *
 * Schema Version:  1.3.2
 * SDK Version:     1.1.5
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 *  - @dmelotik
 */

export class ProtocolSnapshot {
  protocol: PerpetualSchema;
  event: CustomEventType;
  dayID: i32;
  hourID: i32;
  dailyActivityHelper: _ActivityHelper;
  hourlyActivityHelper: _ActivityHelper;

  constructor(protocol: PerpetualSchema, event: CustomEventType) {
    this.protocol = protocol;
    this.event = event;
    this.dayID = getUnixDays(event.block);
    this.hourID = getUnixHours(event.block);

    this.dailyActivityHelper = initActivityHelper(
      Bytes.fromUTF8(
        constants.ActivityInterval.DAILY.concat("-").concat(
          this.dayID.toString()
        )
      )
    );
    this.hourlyActivityHelper = initActivityHelper(
      Bytes.fromUTF8(
        constants.ActivityInterval.HOURLY.concat("-").concat(
          this.hourID.toString()
        )
      )
    );

    this.takeSnapshots();
  }

  addActiveUser(activity: AccountWasActive): void {
    this.dailyActivityHelper.activeUsers += activity.daily ? 1 : 0;
    this.hourlyActivityHelper.activeUsers += activity.hourly ? 1 : 0;

    this.dailyActivityHelper.save();
    this.hourlyActivityHelper.save();
  }

  addActiveDepositor(activity: AccountWasActive): void {
    this.dailyActivityHelper.activeDepositors += activity.daily ? 1 : 0;
    this.dailyActivityHelper.save();
  }

  addActiveBorrower(activity: AccountWasActive): void {
    this.dailyActivityHelper.activeBorrowers += activity.daily ? 1 : 0;
    this.dailyActivityHelper.save();
  }

  addActiveLiquidator(activity: AccountWasActive): void {
    this.dailyActivityHelper.activeLiquidators += activity.daily ? 1 : 0;
    this.dailyActivityHelper.save();
  }

  addActiveLiquidatee(activity: AccountWasActive): void {
    this.dailyActivityHelper.activeLiquidatees += activity.daily ? 1 : 0;
    this.dailyActivityHelper.save();
  }

  addTransaction(type: TransactionType): void {
    if (type == TransactionType.DEPOSIT) {
      this.hourlyActivityHelper.depositCount += 1;
      this.dailyActivityHelper.depositCount += 1;
    } else if (type == TransactionType.WITHDRAW) {
      this.hourlyActivityHelper.withdrawCount += 1;
      this.dailyActivityHelper.withdrawCount += 1;
    } else if (type == TransactionType.BORROW) {
      this.hourlyActivityHelper.borrowCount += 1;
      this.dailyActivityHelper.borrowCount += 1;
    } else if (type == TransactionType.SWAP) {
      this.hourlyActivityHelper.swapCount += 1;
      this.dailyActivityHelper.swapCount += 1;
    }

    this.hourlyActivityHelper.transactionCount += 1;
    this.dailyActivityHelper.transactionCount += 1;

    this.hourlyActivityHelper.save();
    this.dailyActivityHelper.save();
  }

  private takeSnapshots(): void {
    if (!this.protocol._lastUpdateTimestamp) {
      log.error(
        "[isInitialized] cannot create snapshots, protocol: {} not initialized",
        [this.protocol.id.toHexString()]
      );
      return;
    }

    const snapshotDayID =
      this.protocol._lastUpdateTimestamp!.toI32() / constants.SECONDS_PER_DAY;
    const snapshotHourID =
      this.protocol._lastUpdateTimestamp!.toI32() / constants.SECONDS_PER_HOUR;

    if (snapshotDayID != this.dayID) {
      this.takeFinancialsDailySnapshot(snapshotDayID);
      this.takeUsageDailySnapshot(snapshotDayID);
      this.protocol._lastSnapshotDayID = BigInt.fromI32(snapshotDayID);
      this.protocol.save();
    }

    if (snapshotHourID != this.hourID) {
      this.takeUsageHourlySnapshot(snapshotHourID);
      this.protocol._lastSnapshotHourID = BigInt.fromI32(snapshotDayID);
      this.protocol.save();
    }
  }

  private takeFinancialsDailySnapshot(day: i32): void {
    const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));

    const previousSnapshot = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol._lastSnapshotDayID!.toI32())
    );

    snapshot.days = day;
    snapshot.protocol = this.protocol.id;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;

    snapshot.dailyLongOpenInterestUSD = this.protocol.longOpenInterestUSD;
    snapshot.dailyShortOpenInterestUSD = this.protocol.shortOpenInterestUSD;
    snapshot.dailyTotalOpenInterestUSD = this.protocol.totalOpenInterestUSD;

    snapshot.dailyVolumeUSD = previousSnapshot
      ? this.protocol.cumulativeVolumeUSD.minus(
          previousSnapshot.cumulativeVolumeUSD
        )
      : this.protocol.cumulativeVolumeUSD;
    snapshot.cumulativeVolumeUSD = this.protocol.cumulativeVolumeUSD;

    snapshot.dailyInflowVolumeUSD = previousSnapshot
      ? this.protocol.cumulativeInflowVolumeUSD.minus(
          previousSnapshot.cumulativeInflowVolumeUSD
        )
      : this.protocol.cumulativeInflowVolumeUSD;
    snapshot.dailyClosedInflowVolumeUSD = previousSnapshot
      ? this.protocol.cumulativeClosedInflowVolumeUSD.minus(
          previousSnapshot.cumulativeClosedInflowVolumeUSD
        )
      : this.protocol.cumulativeClosedInflowVolumeUSD;
    snapshot.dailyOutflowVolumeUSD = previousSnapshot
      ? this.protocol.cumulativeOutflowVolumeUSD.minus(
          previousSnapshot.cumulativeOutflowVolumeUSD
        )
      : this.protocol.cumulativeOutflowVolumeUSD;

    snapshot.cumulativeInflowVolumeUSD =
      this.protocol.cumulativeInflowVolumeUSD;
    snapshot.cumulativeClosedInflowVolumeUSD =
      this.protocol.cumulativeClosedInflowVolumeUSD;
    snapshot.cumulativeOutflowVolumeUSD =
      this.protocol.cumulativeOutflowVolumeUSD;

    snapshot.dailySupplySideRevenueUSD = previousSnapshot
      ? this.protocol.cumulativeSupplySideRevenueUSD.minus(
          previousSnapshot.cumulativeSupplySideRevenueUSD
        )
      : this.protocol.cumulativeSupplySideRevenueUSD;
    snapshot.dailyProtocolSideRevenueUSD = previousSnapshot
      ? this.protocol.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD
        )
      : this.protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.dailyStakeSideRevenueUSD = previousSnapshot
      ? this.protocol.cumulativeStakeSideRevenueUSD.minus(
          previousSnapshot.cumulativeStakeSideRevenueUSD
        )
      : this.protocol.cumulativeStakeSideRevenueUSD;
    snapshot.dailyTotalRevenueUSD = previousSnapshot
      ? this.protocol.cumulativeTotalRevenueUSD.minus(
          previousSnapshot.cumulativeTotalRevenueUSD
        )
      : this.protocol.cumulativeTotalRevenueUSD;

    snapshot.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeStakeSideRevenueUSD =
      this.protocol.cumulativeStakeSideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD;

    snapshot.dailyEntryPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeEntryPremiumUSD.minus(
          previousSnapshot.cumulativeEntryPremiumUSD
        )
      : this.protocol.cumulativeEntryPremiumUSD;
    snapshot.dailyExitPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeExitPremiumUSD.minus(
          previousSnapshot.cumulativeExitPremiumUSD
        )
      : this.protocol.cumulativeExitPremiumUSD;
    snapshot.dailyTotalPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeTotalPremiumUSD.minus(
          previousSnapshot.cumulativeTotalPremiumUSD
        )
      : this.protocol.cumulativeTotalPremiumUSD;

    snapshot.cumulativeEntryPremiumUSD =
      this.protocol.cumulativeEntryPremiumUSD;
    snapshot.cumulativeExitPremiumUSD = this.protocol.cumulativeExitPremiumUSD;
    snapshot.cumulativeTotalPremiumUSD =
      this.protocol.cumulativeTotalPremiumUSD;

    snapshot.dailyDepositPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeDepositPremiumUSD.minus(
          previousSnapshot.cumulativeDepositPremiumUSD
        )
      : this.protocol.cumulativeDepositPremiumUSD;
    snapshot.dailyWithdrawPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeWithdrawPremiumUSD.minus(
          previousSnapshot.cumulativeWithdrawPremiumUSD
        )
      : this.protocol.cumulativeWithdrawPremiumUSD;
    snapshot.dailyTotalLiquidityPremiumUSD = previousSnapshot
      ? this.protocol.cumulativeTotalLiquidityPremiumUSD.minus(
          previousSnapshot.cumulativeTotalLiquidityPremiumUSD
        )
      : this.protocol.cumulativeTotalLiquidityPremiumUSD;

    snapshot.cumulativeDepositPremiumUSD =
      this.protocol.cumulativeDepositPremiumUSD;
    snapshot.cumulativeWithdrawPremiumUSD =
      this.protocol.cumulativeWithdrawPremiumUSD;
    snapshot.cumulativeTotalLiquidityPremiumUSD =
      this.protocol.cumulativeTotalLiquidityPremiumUSD;

    snapshot.save();
  }

  private takeUsageDailySnapshot(day: i32): void {
    const activity = initActivityHelper(
      Bytes.fromUTF8(
        constants.ActivityInterval.DAILY.concat("-").concat(day.toString())
      )
    );

    const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
    const previousSnapshot = UsageMetricsDailySnapshot.load(
      Bytes.fromI32(this.protocol._lastSnapshotDayID!.toI32())
    );

    snapshot.days = day;
    snapshot.protocol = this.protocol.id;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.dailyActiveUsers = activity.activeUsers;
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    snapshot.dailyLongPositionCount = previousSnapshot
      ? max(
          this.protocol.longPositionCount - previousSnapshot.longPositionCount,
          0
        )
      : this.protocol.longPositionCount;
    snapshot.longPositionCount = this.protocol.longPositionCount;

    snapshot.dailyShortPositionCount = previousSnapshot
      ? max(
          this.protocol.shortPositionCount -
            previousSnapshot.shortPositionCount,
          0
        )
      : this.protocol.shortPositionCount;
    snapshot.shortPositionCount = this.protocol.shortPositionCount;

    snapshot.dailyOpenPositionCount = previousSnapshot
      ? max(
          this.protocol.openPositionCount - previousSnapshot.openPositionCount,
          0
        )
      : this.protocol.openPositionCount;
    snapshot.openPositionCount = this.protocol.openPositionCount;

    snapshot.dailyClosedPositionCount = previousSnapshot
      ? this.protocol.closedPositionCount - previousSnapshot.closedPositionCount
      : this.protocol.closedPositionCount;
    snapshot.closedPositionCount = this.protocol.closedPositionCount;

    snapshot.dailyCumulativePositionCount = previousSnapshot
      ? this.protocol.cumulativePositionCount -
        previousSnapshot.cumulativePositionCount
      : this.protocol.cumulativePositionCount;
    snapshot.cumulativePositionCount = this.protocol.cumulativePositionCount;

    snapshot.dailyTransactionCount = activity.transactionCount;
    snapshot.dailyDepositCount = activity.depositCount;
    snapshot.dailyWithdrawCount = activity.withdrawCount;
    snapshot.dailyBorrowCount = activity.borrowCount;
    snapshot.dailySwapCount = activity.swapCount;

    snapshot.dailyActiveDepositors = activity.activeDepositors;
    snapshot.cumulativeUniqueDepositors =
      this.protocol.cumulativeUniqueDepositors;

    snapshot.dailyActiveBorrowers = activity.activeBorrowers;
    snapshot.cumulativeUniqueBorrowers =
      this.protocol.cumulativeUniqueBorrowers;

    snapshot.dailyActiveLiquidators = activity.activeLiquidators;
    snapshot.cumulativeUniqueLiquidators =
      this.protocol.cumulativeUniqueLiquidators;

    snapshot.dailyActiveLiquidatees = activity.activeLiquidatees;
    snapshot.cumulativeUniqueLiquidatees =
      this.protocol.cumulativeUniqueLiquidatees;

    snapshot.dailyCollateralIn = previousSnapshot
      ? this.protocol.collateralInCount -
        previousSnapshot.cumulativeCollateralIn
      : this.protocol.collateralInCount;
    snapshot.cumulativeCollateralIn = this.protocol.collateralInCount;

    snapshot.dailyCollateralOut = previousSnapshot
      ? this.protocol.collateralOutCount -
        previousSnapshot.cumulativeCollateralOut
      : this.protocol.collateralOutCount;
    snapshot.cumulativeCollateralOut = this.protocol.collateralOutCount;

    snapshot.totalPoolCount = this.protocol.totalPoolCount;
    snapshot.save();
  }

  private takeUsageHourlySnapshot(hour: i32): void {
    const activity = initActivityHelper(
      Bytes.fromUTF8(
        constants.ActivityInterval.HOURLY.concat("-").concat(hour.toString())
      )
    );
    const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));

    snapshot.hours = hour;
    snapshot.protocol = this.protocol.id;
    snapshot.timestamp = this.event.block.timestamp;

    snapshot.hourlyActiveUsers = activity.activeUsers;
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    snapshot.hourlyTransactionCount = activity.transactionCount;
    snapshot.hourlyDepositCount = activity.depositCount;
    snapshot.hourlyWithdrawCount = activity.withdrawCount;
    snapshot.hourlyBorrowCount = activity.borrowCount;
    snapshot.hourlySwapCount = activity.swapCount;
    snapshot.save();
  }
}

export function initActivityHelper(id: Bytes): _ActivityHelper {
  let activityHelper = _ActivityHelper.load(id);

  if (!activityHelper) {
    activityHelper = new _ActivityHelper(id);

    activityHelper.activeUsers = 0;
    activityHelper.activeDepositors = 0;
    activityHelper.activeBorrowers = 0;
    activityHelper.activeLiquidators = 0;
    activityHelper.activeLiquidatees = 0;

    activityHelper.transactionCount = 0;

    activityHelper.depositCount = 0;
    activityHelper.withdrawCount = 0;
    activityHelper.borrowCount = 0;
    activityHelper.swapCount = 0;

    activityHelper.save();
  }

  return activityHelper;
}

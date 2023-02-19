import {
  _ActivityHelper,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  DerivPerpProtocol as PerpetualSchema,
} from "../../../../generated/schema";
import { TransactionType } from "./enums";
import { AccountWasActive } from "./account";
import { Bytes } from "@graphprotocol/graph-ts";
import * as constants from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

export class ProtocolSnapshot {
  protocol: PerpetualSchema;
  event: CustomEventType;
  dayID: i32;
  hourID: i32;
  activityHelper: _ActivityHelper;

  constructor(protocol: PerpetualSchema, event: CustomEventType) {
    this.protocol = protocol;
    this.event = event;
    this.dayID = getUnixDays(event.block);
    this.hourID = getUnixHours(event.block);
    this.activityHelper = initActivityHelper();
    this.takeSnapshots();
  }

  addActiveUser(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveUsers += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveUsers += activity.hourly ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveDepositor(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveDepositors += activity.daily ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveBorrower(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveBorrowers += activity.daily ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveLiquidator(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveLiquidators += activity.daily ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveLiquidatee(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveLiquidatees += activity.daily ? 1 : 0;
    this.activityHelper.save();
  }

  addTransaction(type: TransactionType): void {
    if (type == TransactionType.DEPOSIT) {
      this.activityHelper.dailyDepositCount += 1;
    } else if (type == TransactionType.WITHDRAW) {
      this.activityHelper.dailyWithdrawCount += 1;
    } else if (type == TransactionType.BORROW) {
      this.activityHelper.dailyBorrowCount += 1;
    } else if (type == TransactionType.SWAP) {
      this.activityHelper.dailySwapCount += 1;
    }

    this.activityHelper.dailyTransactionCount += 1;
    this.activityHelper.save();
  }

  private takeSnapshots(): void {
    if (!this.protocol._lastUpdateTimestamp) return;

    const snapshotDayID =
      this.protocol._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_DAY;
    const snapshotHourID =
      this.protocol._lastUpdateTimestamp.toI32() / constants.SECONDS_PER_HOUR;

    if (snapshotDayID != this.dayID) {
      this.takeFinancialsDailySnapshot(snapshotDayID);
      this.takeUsageDailySnapshot(snapshotDayID);
      this.protocol._lastSnapshotDayID = snapshotDayID;
      this.protocol.save();
    }

    if (snapshotHourID != this.hourID) {
      this.takeUsageHourlySnapshot(snapshotHourID);
      this.protocol._lastSnapshotHourID = snapshotHourID;
      this.protocol.save();
    }
  }

  private takeFinancialsDailySnapshot(day: i32): void {
    const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));

    const previousSnapshot = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol._lastSnapshotDayID)
    );

    snapshot.days = day;
    snapshot.protocol = this.protocol.id;

    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    snapshot.dailyOpenInterestUSD = this.protocol.openInterestUSD;
    snapshot.protocolControlledValueUSD =
      this.protocol.protocolControlledValueUSD;

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
    const activity = this.activityHelper;

    const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
    const previousSnapshot = UsageMetricsDailySnapshot.load(
      Bytes.fromI32(this.protocol._lastSnapshotDayID)
    );

    snapshot.days = day;
    snapshot.protocol = this.protocol.id;

    snapshot.dailyActiveUsers = activity.dailyActiveUsers;
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    snapshot.dailyLongPositionCount = previousSnapshot
      ? this.protocol.longPositionCount - previousSnapshot.longPositionCount
      : this.protocol.longPositionCount;
    snapshot.longPositionCount = this.protocol.longPositionCount;

    snapshot.dailyShortPositionCount = previousSnapshot
      ? this.protocol.shortPositionCount - previousSnapshot.shortPositionCount
      : this.protocol.shortPositionCount;
    snapshot.shortPositionCount = this.protocol.shortPositionCount;

    snapshot.dailyOpenPositionCount = previousSnapshot
      ? this.protocol.openPositionCount - previousSnapshot.openPositionCount
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

    snapshot.dailyTransactionCount = activity.dailyTransactionCount;
    snapshot.dailyDepositCount = activity.dailyDepositCount;
    snapshot.dailyWithdrawCount = activity.dailyWithdrawCount;
    snapshot.dailyBorrowCount = activity.dailyBorrowCount;
    snapshot.dailySwapCount = activity.dailySwapCount;

    snapshot.dailyActiveDepositors = activity.dailyActiveDepositors;
    snapshot.cumulativeUniqueDepositors =
      this.protocol.cumulativeUniqueDepositors;

    snapshot.dailyActiveBorrowers = activity.dailyActiveBorrowers;
    snapshot.cumulativeUniqueBorrowers =
      this.protocol.cumulativeUniqueBorrowers;

    snapshot.dailyActiveLiquidators = activity.dailyActiveLiquidators;
    snapshot.cumulativeUniqueLiquidators =
      this.protocol.cumulativeUniqueLiquidators;

    snapshot.dailyActiveLiquidatees = activity.dailyActiveLiquidatees;
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

    activity.dailyActiveUsers = 0;
    activity.dailyActiveDepositors = 0;
    activity.dailyActiveBorrowers = 0;
    activity.dailyActiveLiquidators = 0;
    activity.dailyActiveLiquidatees = 0;

    activity.dailyTransactionCount = 0;
    activity.dailyDepositCount = 0;
    activity.dailyWithdrawCount = 0;
    activity.dailyBorrowCount = 0;
    activity.dailySwapCount = 0;
    activity.save();
  }

  private takeUsageHourlySnapshot(hour: i32): void {
    const activity = this.activityHelper;
    const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));

    snapshot.hours = hour;
    snapshot.protocol = this.protocol.id;

    snapshot.hourlyActiveUsers = activity.hourlyActiveUsers;
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    snapshot.hourlyTransactionCount = activity.hourlyTransactionCount;
    snapshot.hourlyDepositCount = activity.hourlyDepositCount;
    snapshot.hourlyWithdrawCount = activity.hourlyWithdrawCount;
    snapshot.hourlyBorrowCount = activity.hourlyBorrowCount;
    snapshot.hourlySwapCount = activity.hourlySwapCount;
    snapshot.save();

    activity.hourlyActiveUsers = 0;
    activity.hourlyTransactionCount = 0;
    activity.hourlyDepositCount = 0;
    activity.hourlyWithdrawCount = 0;
    activity.hourlyBorrowCount = 0;
    activity.hourlySwapCount = 0;
    activity.save();
  }
}

function initActivityHelper(): _ActivityHelper {
  const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");
  let helper = _ActivityHelper.load(ActivityHelperID);
  if (helper) return helper;

  helper = new _ActivityHelper(ActivityHelperID);
  helper.dailyActiveUsers = 0;
  helper.hourlyActiveUsers = 0;

  helper.dailyActiveDepositors = 0;
  helper.dailyActiveBorrowers = 0;
  helper.dailyActiveLiquidators = 0;
  helper.dailyActiveLiquidatees = 0;

  helper.dailyTransactionCount = 0;
  helper.hourlyTransactionCount = 0;
  helper.dailyDepositCount = 0;
  helper.hourlyDepositCount = 0;
  helper.dailyWithdrawCount = 0;
  helper.hourlyWithdrawCount = 0;
  helper.dailyBorrowCount = 0;
  helper.hourlyBorrowCount = 0;
  helper.dailySwapCount = 0;
  helper.hourlySwapCount = 0;

  helper.save();

  return helper;
}

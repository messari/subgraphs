import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { AccountWasActive } from "./account";
import {
  Protocol as ProtocolSchema,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _ActivityHelper,
} from "../../../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");

/**
 * Helper class to manage Financials and Usage snapshots.
 * It is not meant to be used directly, but rather by the Protocol and Account lib classes.
 * Whenever it is instantiated it will check if it is time to take any of the
 * dailyFinancials, dailyUsage or hourlyUsage snapshots.
 *
 * Snapshots are taken in a way that allows the snapshot entity to be immutable.
 */
export class ProtocolSnapshot {
  protocol: ProtocolSchema;
  event: CustomEventType;
  dayID: i32;
  hourID: i32;
  activityHelper: _ActivityHelper;

  constructor(protocol: ProtocolSchema, event: CustomEventType) {
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

  private takeSnapshots(): void {
    const snapshotDayID =
      this.protocol.lastUpdateTimestamp!.toI32() / SECONDS_PER_DAY;
    const snapshotHourID =
      this.protocol.lastUpdateTimestamp!.toI32() / SECONDS_PER_HOUR;

    if (snapshotDayID != this.dayID) {
      this.takeFinancialsDailySnapshot(snapshotDayID);
      this.takeUsageDailySnapshot(snapshotDayID);
      this.protocol.lastSnapshotDayID = BigInt.fromI32(snapshotDayID);
      this.protocol.save();
    }

    if (snapshotHourID != this.hourID) {
      this.takeUsageHourlySnapshot(snapshotHourID);
      this.protocol.lastSnapshotHourID = BigInt.fromI32(snapshotHourID);
      this.protocol.save();
    }
  }

  private takeFinancialsDailySnapshot(day: i32): void {
    const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));
    const previousSnapshot = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol.lastSnapshotDayID!.toI32())
    );

    snapshot.day = day;
    snapshot.protocol = this.protocol.id;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    // tvl
    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;
    snapshot.protocolControlledValueUSD =
      this.protocol.protocolControlledValueUSD;

    // revenues
    snapshot.cumulativeSupplySideRevenueUSD =
      this.protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      this.protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD =
      this.protocol.cumulativeTotalRevenueUSD;

    // deltas
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;

    if (previousSnapshot) {
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
    }
    snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.dailyTotalRevenueUSD = totalRevenueDelta;

    snapshot.save();
  }

  private takeUsageDailySnapshot(day: i32): void {
    const activity = this.activityHelper;

    const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
    const previousSnapshot = UsageMetricsDailySnapshot.load(
      Bytes.fromI32(this.protocol.lastSnapshotDayID!.toI32())
    );

    snapshot.protocol = this.protocol.id;
    snapshot.day = day;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    // unique users
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    // daily activity
    snapshot.dailyActiveUsers = activity.dailyActiveUsers;

    // transaction counts
    snapshot._cumulativeTransactionCount =
      this.protocol._cumulativeTransactionCount;

    // misc
    snapshot.totalPoolCount = this.protocol.totalPoolCount;

    // deltas
    let transactionDelta = snapshot._cumulativeTransactionCount;

    if (previousSnapshot) {
      transactionDelta =
        snapshot._cumulativeTransactionCount -
        previousSnapshot._cumulativeTransactionCount;
    }
    snapshot.dailyTransactionCount = transactionDelta;
    snapshot.save();

    activity.dailyActiveUsers = 0;
    activity.save();
  }

  private takeUsageHourlySnapshot(hour: i32): void {
    const activity = this.activityHelper;

    const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));
    const previousSnapshot = UsageMetricsHourlySnapshot.load(
      Bytes.fromI32(this.protocol.lastSnapshotHourID!.toI32())
    );

    snapshot.protocol = this.protocol.id;
    snapshot.hour = hour;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    // unique users
    snapshot.cumulativeUniqueUsers = this.protocol.cumulativeUniqueUsers;

    // hourly activity
    snapshot.hourlyActiveUsers = activity.hourlyActiveUsers;

    // transaction counts
    snapshot._cumulativeTransactionCount =
      this.protocol._cumulativeTransactionCount;

    // deltas
    let transactionDelta = snapshot._cumulativeTransactionCount;
    if (previousSnapshot) {
      transactionDelta =
        snapshot._cumulativeTransactionCount -
        previousSnapshot._cumulativeTransactionCount;
    }
    snapshot.hourlyTransactionCount = transactionDelta;
    snapshot.save();

    activity.hourlyActiveUsers = 0;
    activity.save();
  }
}

function initActivityHelper(): _ActivityHelper {
  let helper = _ActivityHelper.load(ActivityHelperID);
  if (helper) {
    return helper;
  }
  helper = new _ActivityHelper(ActivityHelperID);
  helper.hourlyActiveUsers = 0;
  helper.dailyActiveUsers = 0;

  helper.save();
  return helper;
}

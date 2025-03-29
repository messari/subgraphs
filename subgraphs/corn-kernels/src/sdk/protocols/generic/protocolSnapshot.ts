import {
  _ActivityHelper,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  Protocol as ProtocolSchema,
} from "../../../../generated/schema";
import { AccountWasActive } from "./account";
import { Bytes } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY } from "../../util/constants";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");

/**
 * This file contains the ProtocolSnapshot, which is used to
 * make all of the storage changes that occur in the protocol's
 * daily and hourly snapshots.
 *
 * Schema Version:  3.0.0
 * SDK Version:     1.1.0
 * Author(s):
 *  - @steegecs
 *  - @shashwatS22
 */

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
    this.activityHelper.save();
  }

  private takeSnapshots(): void {
    const snapshotDayID =
      this.protocol.lastUpdateTimestamp.toI32() / SECONDS_PER_DAY;

    if (snapshotDayID != this.dayID) {
      this.takeFinancialsDailySnapshot(snapshotDayID);
      this.takeUsageDailySnapshot(snapshotDayID);
      this.protocol.lastSnapshotDayID = snapshotDayID;
      this.protocol.save();
    }
  }

  private takeFinancialsDailySnapshot(day: i32): void {
    const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));
    const previousSnapshot = FinancialsDailySnapshot.load(
      Bytes.fromI32(this.protocol.lastSnapshotDayID),
    );

    snapshot.day = day;
    snapshot.protocol = this.protocol.id;
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;

    // tvl
    snapshot.totalValueLockedUSD = this.protocol.totalValueLockedUSD;

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
        previousSnapshot.cumulativeSupplySideRevenueUSD,
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previousSnapshot.cumulativeProtocolSideRevenueUSD,
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previousSnapshot.cumulativeTotalRevenueUSD,
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
      Bytes.fromI32(this.protocol.lastSnapshotDayID),
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
    snapshot.cumulativeTransactionCount =
      this.protocol.cumulativeTransactionCount;

    // misc
    snapshot.totalPoolCount = this.protocol.totalPoolCount;

    // deltas
    let transactionDelta = snapshot.cumulativeTransactionCount;

    if (previousSnapshot) {
      transactionDelta =
        snapshot.cumulativeTransactionCount -
        previousSnapshot.cumulativeTransactionCount;
    }
    snapshot.dailyTransactionCount = transactionDelta;
    snapshot.save();

    activity.dailyActiveUsers = 0;
    activity.save();
  }
}

function initActivityHelper(): _ActivityHelper {
  let helper = _ActivityHelper.load(ActivityHelperID);
  if (helper) {
    return helper;
  }
  helper = new _ActivityHelper(ActivityHelperID);
  helper.dailyActiveUsers = 0;

  helper.save();
  return helper;
}

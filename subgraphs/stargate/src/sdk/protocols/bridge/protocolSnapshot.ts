import { Bytes } from "@graphprotocol/graph-ts";
import { AccountWasActive } from "./account";
import {
  BridgeProtocol as BridgeProtocolSchema,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
  _ProtocolSnapshotHelper,
  _ActivityHelper,
} from "../../../../generated/schema";
import {
  BIGINT_ZERO,
  SECONDS_PER_DAY_BI,
  SECONDS_PER_HOUR_BI,
} from "../../util/constants";
import { CustomEventType } from ".";

const SnapshotHelperID = Bytes.fromUTF8("_ProtocolSnapshotHelper");
const ActivityHelperID = Bytes.fromUTF8("_ActivityHelper");

/**
 * Helper class to manage Financials and Usage snapshots.
 * It is not meant to be used directly, but rather by the Bridge and Account lib classes.
 * Whenever it is instantiated it will check if it is time to take any of the
 * dailyFinancials, dailyUsage or hourlyUsage snapshots.
 *
 * Snapshots are taken in a way that allows the snapshot entity to be immutable.
 */
export class ProtocolSnapshot {
  protocol: BridgeProtocolSchema;
  event: CustomEventType;
  helper: _ProtocolSnapshotHelper;
  activityHelper: _ActivityHelper;

  constructor(protocol: BridgeProtocolSchema, event: CustomEventType) {
    this.protocol = protocol;
    this.event = event;
    this.helper = initProtocolHelper();
    this.activityHelper = initActivityHelper();
    this.takeSnapshots();
  }

  addActiveUser(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveUsers += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveUsers += activity.hourly ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveTransferSender(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveTransferSenders += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveTransferSenders += activity.hourly ? 1 : 0;
    this.activityHelper.save();
  }

  addActiveTransferReceiver(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveTransferReceivers += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveTransferReceivers += activity.hourly
      ? 1
      : 0;
    this.activityHelper.save();
  }

  addActiveLiquidityProvider(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveLiquidityProviders += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveLiquidityProviders += activity.hourly
      ? 1
      : 0;
    this.activityHelper.save();
  }

  addActiveMessageSender(activity: AccountWasActive): void {
    this.activityHelper.dailyActiveMessageSenders += activity.daily ? 1 : 0;
    this.activityHelper.hourlyActiveMessageSenders += activity.hourly ? 1 : 0;
    this.activityHelper.save();
  }

  private takeSnapshots(): void {
    const helper = this.helper;
    if (
      helper.lastDailyFinancialsTimestamp
        .plus(SECONDS_PER_DAY_BI)
        .lt(this.event.block.timestamp)
    ) {
      this.takeFinancialsDailySnapshot();
    }
    if (
      helper.lastDailyUsageTimestamp
        .plus(SECONDS_PER_DAY_BI)
        .lt(this.event.block.timestamp)
    ) {
      this.takeUsageDailySnapshot();
    }
    if (
      helper.lastHourlyUsageTimestamp
        .plus(SECONDS_PER_HOUR_BI)
        .lt(this.event.block.timestamp)
    ) {
      this.takeUsageHourlySnapshot();
    }
  }

  private takeFinancialsDailySnapshot(): void {
    const helper = this.helper;
    const block = this.event.block;
    const protocol = this.protocol;
    const day = block.timestamp.div(SECONDS_PER_DAY_BI).toI32();

    const snapshot = new FinancialsDailySnapshot(Bytes.fromI32(day));
    snapshot.protocol = protocol.id;
    snapshot.day = day;
    snapshot.blockNumber = block.number;
    snapshot.timestamp = block.timestamp;

    // tvl
    snapshot.totalValueLockedUSD = protocol.totalValueLockedUSD;
    snapshot.protocolControlledValueUSD = protocol.protocolControlledValueUSD;

    // revenues
    snapshot.cumulativeSupplySideRevenueUSD =
      protocol.cumulativeSupplySideRevenueUSD;
    snapshot.cumulativeProtocolSideRevenueUSD =
      protocol.cumulativeProtocolSideRevenueUSD;
    snapshot.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

    // volumes
    snapshot.cumulativeVolumeInUSD = protocol.cumulativeVolumeInUSD;
    snapshot.cumulativeVolumeOutUSD = protocol.cumulativeVolumeOutUSD;
    snapshot.cumulativeNetVolumeUSD = protocol.netVolumeUSD;

    // deltas
    let supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD;
    let protocolSideRevenueDelta = snapshot.cumulativeProtocolSideRevenueUSD;
    let totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD;
    let volumeInDelta = snapshot.cumulativeVolumeInUSD;
    let volumeOutDelta = snapshot.cumulativeVolumeOutUSD;
    let netVolumeDelta = snapshot.cumulativeNetVolumeUSD;
    const previous = FinancialsDailySnapshot.load(
      helper.lastDailyFinancialsSnapshot
    );
    if (previous) {
      supplySideRevenueDelta = snapshot.cumulativeSupplySideRevenueUSD.minus(
        previous.cumulativeSupplySideRevenueUSD
      );
      protocolSideRevenueDelta =
        snapshot.cumulativeProtocolSideRevenueUSD.minus(
          previous.cumulativeProtocolSideRevenueUSD
        );
      totalRevenueDelta = snapshot.cumulativeTotalRevenueUSD.minus(
        previous.cumulativeTotalRevenueUSD
      );
      volumeInDelta = snapshot.cumulativeVolumeInUSD.minus(
        previous.cumulativeVolumeInUSD
      );
      volumeOutDelta = snapshot.cumulativeVolumeOutUSD.minus(
        previous.cumulativeVolumeOutUSD
      );
      netVolumeDelta = snapshot.cumulativeNetVolumeUSD.minus(
        previous.cumulativeNetVolumeUSD
      );
    }
    snapshot.dailySupplySideRevenueUSD = supplySideRevenueDelta;
    snapshot.dailyProtocolSideRevenueUSD = protocolSideRevenueDelta;
    snapshot.dailyTotalRevenueUSD = totalRevenueDelta;
    snapshot.dailyVolumeInUSD = volumeInDelta;
    snapshot.dailyVolumeOutUSD = volumeOutDelta;
    snapshot.dailyNetVolumeUSD = netVolumeDelta;
    snapshot.save();

    helper.lastDailyFinancialsTimestamp = block.timestamp;
    helper.lastDailyFinancialsSnapshot = snapshot.id;
    helper.save();
  }

  private takeUsageDailySnapshot(): void {
    const helper = this.helper;
    const activity = this.activityHelper;
    const block = this.event.block;
    const protocol = this.protocol;
    const day = block.timestamp.div(SECONDS_PER_DAY_BI).toI32();

    const snapshot = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
    snapshot.protocol = protocol.id;
    snapshot.day = day;
    snapshot.blockNumber = block.number;
    snapshot.timestamp = block.timestamp;

    // unique users
    snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    snapshot.cumulativeUniqueTransferSenders =
      protocol.cumulativeUniqueTransferSenders;
    snapshot.cumulativeUniqueTransferReceivers =
      protocol.cumulativeUniqueTransferReceivers;
    snapshot.cumulativeUniqueLiquidityProviders =
      protocol.cumulativeUniqueLiquidityProviders;
    snapshot.cumulativeUniqueMessageSenders =
      protocol.cumulativeUniqueMessageSenders;

    // daily activity
    snapshot.dailyActiveUsers = activity.dailyActiveUsers;
    snapshot.dailyActiveTransferSenders = activity.dailyActiveTransferSenders;
    snapshot.dailyActiveTransferReceivers =
      activity.dailyActiveTransferReceivers;
    snapshot.dailyActiveLiquidityProviders =
      activity.dailyActiveLiquidityProviders;
    snapshot.dailyActiveMessageSenders = activity.dailyActiveMessageSenders;

    // transaction counts
    snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;
    snapshot.cumulativeTransferOutCount = protocol.cumulativeTransferOutCount;
    snapshot.cumulativeTransferInCount = protocol.cumulativeTransferInCount;
    snapshot.cumulativeLiquidityDepositCount =
      protocol.cumulativeLiquidityDepositCount;
    snapshot.cumulativeLiquidityWithdrawCount =
      protocol.cumulativeLiquidityWithdrawCount;
    snapshot.cumulativeMessageSentCount = protocol.cumulativeMessageSentCount;
    snapshot.cumulativeMessageReceivedCount =
      protocol.cumulativeMessageReceivedCount;

    // misc
    snapshot.totalPoolCount = protocol.totalPoolCount;
    snapshot.totalPoolRouteCount = protocol.totalPoolRouteCount;
    snapshot.totalCanonicalRouteCount = protocol.totalCanonicalRouteCount;
    snapshot.totalWrappedRouteCount = protocol.totalWrappedRouteCount;
    snapshot.totalSupportedTokenCount = protocol.totalSupportedTokenCount;

    // deltas
    let transactionDelta = snapshot.cumulativeTransactionCount;
    let transferOutDelta = snapshot.cumulativeTransferOutCount;
    let transferInDelta = snapshot.cumulativeTransferInCount;
    let liquidityDepositDelta = snapshot.cumulativeLiquidityDepositCount;
    let liquidityWithdrawDelta = snapshot.cumulativeLiquidityWithdrawCount;
    let messageSentDelta = snapshot.cumulativeMessageSentCount;
    let messageReceivedDelta = snapshot.cumulativeMessageReceivedCount;
    const previous = UsageMetricsDailySnapshot.load(
      helper.lastDailyUsageSnapshot
    );
    if (previous) {
      transactionDelta =
        snapshot.cumulativeTransactionCount -
        previous.cumulativeTransactionCount;
      transferOutDelta =
        snapshot.cumulativeTransferOutCount -
        previous.cumulativeTransferOutCount;
      transferInDelta =
        snapshot.cumulativeTransferInCount - previous.cumulativeTransferInCount;
      liquidityDepositDelta =
        snapshot.cumulativeLiquidityDepositCount -
        previous.cumulativeLiquidityDepositCount;
      liquidityWithdrawDelta =
        snapshot.cumulativeLiquidityWithdrawCount -
        previous.cumulativeLiquidityWithdrawCount;
      messageSentDelta =
        snapshot.cumulativeMessageSentCount -
        previous.cumulativeMessageSentCount;
      messageReceivedDelta =
        snapshot.cumulativeMessageReceivedCount -
        previous.cumulativeMessageReceivedCount;
    }
    snapshot.dailyTransactionCount = transactionDelta;
    snapshot.dailyTransferOutCount = transferOutDelta;
    snapshot.dailyTransferInCount = transferInDelta;
    snapshot.dailyLiquidityDepositCount = liquidityDepositDelta;
    snapshot.dailyLiquidityWithdrawCount = liquidityWithdrawDelta;
    snapshot.dailyMessageSentCount = messageSentDelta;
    snapshot.dailyMessageReceivedCount = messageReceivedDelta;
    snapshot.save();

    helper.lastDailyUsageTimestamp = block.timestamp;
    helper.lastDailyUsageSnapshot = snapshot.id;
    helper.save();
    activity.dailyActiveUsers = 0;
    activity.dailyActiveTransferSenders = 0;
    activity.dailyActiveTransferReceivers = 0;
    activity.dailyActiveLiquidityProviders = 0;
    activity.dailyActiveMessageSenders = 0;
    activity.save();
  }

  private takeUsageHourlySnapshot(): void {
    const helper = this.helper;
    const activity = this.activityHelper;
    const block = this.event.block;
    const protocol = this.protocol;
    const hour = block.timestamp.div(SECONDS_PER_HOUR_BI).toI32();

    const snapshot = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));
    snapshot.protocol = protocol.id;
    snapshot.hour = hour;
    snapshot.blockNumber = block.number;
    snapshot.timestamp = block.timestamp;

    // unique users
    snapshot.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    snapshot.cumulativeUniqueTransferSenders =
      protocol.cumulativeUniqueTransferSenders;
    snapshot.cumulativeUniqueTransferReceivers =
      protocol.cumulativeUniqueTransferReceivers;
    snapshot.cumulativeUniqueLiquidityProviders =
      protocol.cumulativeUniqueLiquidityProviders;
    snapshot.cumulativeUniqueMessageSenders =
      protocol.cumulativeUniqueMessageSenders;

    // hourly activity
    snapshot.hourlyActiveUsers = activity.hourlyActiveUsers;
    snapshot.hourlyActiveTransferSenders = activity.hourlyActiveTransferSenders;
    snapshot.hourlyActiveTransferReceivers =
      activity.hourlyActiveTransferReceivers;
    snapshot.hourlyActiveLiquidityProviders =
      activity.hourlyActiveLiquidityProviders;
    snapshot.hourlyActiveMessageSenders = activity.hourlyActiveMessageSenders;

    // transaction counts
    snapshot.cumulativeTransactionCount = protocol.cumulativeTransactionCount;
    snapshot.cumulativeTransferOutCount = protocol.cumulativeTransferOutCount;
    snapshot.cumulativeTransferInCount = protocol.cumulativeTransferInCount;
    snapshot.cumulativeLiquidityDepositCount =
      protocol.cumulativeLiquidityDepositCount;
    snapshot.cumulativeLiquidityWithdrawCount =
      protocol.cumulativeLiquidityWithdrawCount;
    snapshot.cumulativeMessageSentCount = protocol.cumulativeMessageSentCount;
    snapshot.cumulativeMessageReceivedCount =
      protocol.cumulativeMessageReceivedCount;

    // deltas
    let transactionDelta = snapshot.cumulativeTransactionCount;
    let transferOutDelta = snapshot.cumulativeTransferOutCount;
    let transferInDelta = snapshot.cumulativeTransferInCount;
    let liquidityDepositDelta = snapshot.cumulativeLiquidityDepositCount;
    let liquidityWithdrawDelta = snapshot.cumulativeLiquidityWithdrawCount;
    let messageSentDelta = snapshot.cumulativeMessageSentCount;
    let messageReceivedDelta = snapshot.cumulativeMessageReceivedCount;
    const previous = UsageMetricsHourlySnapshot.load(
      helper.lastHourlyUsageSnapshot
    );
    if (previous) {
      transactionDelta =
        snapshot.cumulativeTransactionCount -
        previous.cumulativeTransactionCount;
      transferOutDelta =
        snapshot.cumulativeTransferOutCount -
        previous.cumulativeTransferOutCount;
      transferInDelta =
        snapshot.cumulativeTransferInCount - previous.cumulativeTransferInCount;
      liquidityDepositDelta =
        snapshot.cumulativeLiquidityDepositCount -
        previous.cumulativeLiquidityDepositCount;
      liquidityWithdrawDelta =
        snapshot.cumulativeLiquidityWithdrawCount -
        previous.cumulativeLiquidityWithdrawCount;
      messageSentDelta =
        snapshot.cumulativeMessageSentCount -
        previous.cumulativeMessageSentCount;
      messageReceivedDelta =
        snapshot.cumulativeMessageReceivedCount -
        previous.cumulativeMessageReceivedCount;
    }
    snapshot.hourlyTransactionCount = transactionDelta;
    snapshot.hourlyTransferOutCount = transferOutDelta;
    snapshot.hourlyTransferInCount = transferInDelta;
    snapshot.hourlyLiquidityDepositCount = liquidityDepositDelta;
    snapshot.hourlyLiquidityWithdrawCount = liquidityWithdrawDelta;
    snapshot.hourlyMessageSentCount = messageSentDelta;
    snapshot.hourlyMessageReceivedCount = messageReceivedDelta;
    snapshot.save();

    helper.lastHourlyUsageTimestamp = block.timestamp;
    helper.lastHourlyUsageSnapshot = snapshot.id;
    helper.save();
    activity.hourlyActiveUsers = 0;
    activity.hourlyActiveTransferSenders = 0;
    activity.hourlyActiveTransferReceivers = 0;
    activity.hourlyActiveLiquidityProviders = 0;
    activity.hourlyActiveMessageSenders = 0;
    activity.save();
  }
}

function initProtocolHelper(): _ProtocolSnapshotHelper {
  let helper = _ProtocolSnapshotHelper.load(SnapshotHelperID);
  if (helper) {
    return helper;
  }
  helper = new _ProtocolSnapshotHelper(SnapshotHelperID);
  helper.lastActivityTimestamp = BIGINT_ZERO;
  helper.lastDailyFinancialsTimestamp = BIGINT_ZERO;
  helper.lastDailyFinancialsSnapshot = Bytes.fromI32(0);
  helper.lastDailyUsageTimestamp = BIGINT_ZERO;
  helper.lastDailyUsageSnapshot = Bytes.fromI32(0);
  helper.lastHourlyUsageTimestamp = BIGINT_ZERO;
  helper.lastHourlyUsageSnapshot = Bytes.fromI32(0);
  helper.save();
  return helper;
}

function initActivityHelper(): _ActivityHelper {
  let helper = _ActivityHelper.load(ActivityHelperID);
  if (helper) {
    return helper;
  }
  helper = new _ActivityHelper(ActivityHelperID);
  helper.hourlyActiveUsers = 0;
  helper.dailyActiveUsers = 0;
  helper.hourlyActiveTransferSenders = 0;
  helper.dailyActiveTransferSenders = 0;
  helper.hourlyActiveTransferReceivers = 0;
  helper.dailyActiveTransferReceivers = 0;
  helper.hourlyActiveLiquidityProviders = 0;
  helper.dailyActiveLiquidityProviders = 0;
  helper.hourlyActiveMessageSenders = 0;
  helper.dailyActiveMessageSenders = 0;
  helper.save();
  return helper;
}

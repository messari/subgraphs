import { Address, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../../../generated/schema";
import {
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../../../../src/utils/constants";
import { getOrCreateLendingProtocol } from "./protocol";

export function getOrCreateUsageMetricsSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const id = `${event.block.timestamp.toI64() / SECONDS_PER_DAY}`;
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailyBorrowCount = INT_ZERO;
    usageMetrics.dailyRepayCount = INT_ZERO;
    usageMetrics.dailyLiquidateCount = INT_ZERO;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const timestamp = event.block.timestamp.toI64();
  const hour = timestamp / SECONDS_PER_HOUR;
  const id = `${hour}`;
  let usageMetrics = UsageMetricsHourlySnapshot.load(id);
  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(id);
    usageMetrics.protocol = protocol.id;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlyBorrowCount = INT_ZERO;
    usageMetrics.hourlyRepayCount = INT_ZERO;
    usageMetrics.hourlyLiquidateCount = INT_ZERO;
  }
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  return usageMetrics;
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  const timestamp = event.block.timestamp.toI64();
  const day = `${timestamp / SECONDS_PER_DAY}`;
  const hour = `${timestamp / SECONDS_PER_HOUR}`;
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();
    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
    usageMetricsDailySnapshot.cumulativeUniqueUsers += 1;
    usageMetricsHourlySnapshot.cumulativeUniqueUsers += 1;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = `daily-${accountId}-${day}`;
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetricsDailySnapshot.dailyActiveUsers += 1;
  }
  // Combine the id, user address and hour to generate a unique user id for the hour
  let hourlyActiveAccountId = `hourly-${accountId}-${hour}`;
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
  }
  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolDepositCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyDepositCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyDepositCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolBorrowCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyBorrowCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyBorrowCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolWithdrawCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyWithdrawCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolRepayCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyRepayCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyRepayCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolLiquidateCount(event: ethereum.Event): void {
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyLiquidateCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyLiquidateCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolTotalPoolCount(event: ethereum.Event): void {
  const protocol = getOrCreateLendingProtocol();
  const dailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  protocol.totalPoolCount += 1;
  dailySnapshot.totalPoolCount += 1;
  protocol.save();
  dailySnapshot.save();
}

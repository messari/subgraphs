import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import {
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "../common/constants";
import {
  getOrCreateOpynProtocol,
  incrementProtocolUniqueLPs,
  incrementProtocolUniqueTakers,
} from "./protocol";

export function getOrCreateUsageMetricsSnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromI32(days);
  const protocol = getOrCreateOpynProtocol();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.days = days;
    usageMetrics.protocol = protocol.id;

    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.dailyUniqueLP = INT_ZERO;
    usageMetrics.dailyUniqueTakers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;
  }
  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;
  usageMetrics.totalPoolCount = protocol.totalPoolCount;
  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  const hours = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
  const id = Bytes.fromI32(hours);
  const protocol = getOrCreateOpynProtocol();
  let usageMetrics = UsageMetricsHourlySnapshot.load(id);
  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(id);
    usageMetrics.hours = hours;
    usageMetrics.protocol = protocol.id;

    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;
  }
  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetrics.cumulativeUniqueLP = protocol.cumulativeUniqueLP;
  usageMetrics.cumulativeUniqueTakers = protocol.cumulativeUniqueTakers;
  return usageMetrics;
}

export function updateActiveAccounts(
  event: ethereum.Event,
  account: Account
): void {
  const timestamp = event.block.timestamp.toI64();
  const days = `${timestamp / SECONDS_PER_DAY}`;
  const hours = `${timestamp / SECONDS_PER_HOUR}`;
  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = Bytes.fromUTF8(
    `daily-${account.id.toHex()}-${days}`
  );
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetricsDailySnapshot.dailyActiveUsers += 1;
    usageMetricsDailySnapshot.save();
  }
  // Combine the id, user address and hour to generate a unique user id for the hour
  let hourlyActiveAccountId = Bytes.fromUTF8(
    `hourly-${account.id.toHex()}-${hours}`
  );
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    const usageMetricsHourlySnapshot =
      getOrCreateUsageMetricsHourlySnapshot(event);
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    hourlyActiveAccount.save();
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
    usageMetricsHourlySnapshot.save();
  }
}

function isUniqueUser(account: Account, action: string): boolean {
  let id = Bytes.fromUTF8(`${account.id.toHex()}-${action}`);
  let activeAccount = ActiveAccount.load(id);
  if (!activeAccount) {
    activeAccount = new ActiveAccount(id);
    activeAccount.save();
    return true;
  }
  return false;
}

function isUniqueDailyUser(
  event: ethereum.Event,
  account: Account,
  action: string
): boolean {
  const timestamp = event.block.timestamp.toI64();
  const day = `${timestamp / SECONDS_PER_DAY}`;
  // Combine the id, user address, and action to generate a unique user id for the day
  let dailyActionActiveAccountId = Bytes.fromUTF8(
    `daily-${account.id.toHex()}-${action}-${day}`
  );
  let dailyActionActiveAccount = ActiveAccount.load(dailyActionActiveAccountId);
  if (!dailyActionActiveAccount) {
    dailyActionActiveAccount = new ActiveAccount(dailyActionActiveAccountId);
    dailyActionActiveAccount.save();
    return true;
  }
  return false;
}

export function incrementProtocolDepositCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "lp")) {
    incrementProtocolUniqueLPs();
  }
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyDepositCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  if (isUniqueDailyUser(event, account, "lp")) {
    usageMetricsDailySnapshot.dailyUniqueLP += 1;
  }
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyDepositCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}

export function incrementProtocolWithdrawCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "lp")) {
    incrementProtocolUniqueLPs();
  }
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  usageMetricsDailySnapshot.dailyWithdrawCount += 1;
  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  if (isUniqueDailyUser(event, account, "lp")) {
    usageMetricsDailySnapshot.dailyUniqueLP += 1;
  }
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.hourlyWithdrawCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;
  usageMetricsHourlySnapshot.save();
}
export function incrementProtocolTakerCount(
  event: ethereum.Event,
  account: Account
): void {
  updateActiveAccounts(event, account);
  if (isUniqueUser(account, "taker")) {
    incrementProtocolUniqueTakers();
  }
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsSnapshot(event);
  if (isUniqueDailyUser(event, account, "taker")) {
    usageMetricsDailySnapshot.dailyUniqueTakers += 1;
  }
  usageMetricsDailySnapshot.save();
  const usageMetricsHourlySnapshot =
    getOrCreateUsageMetricsHourlySnapshot(event);
  usageMetricsHourlySnapshot.save();
}

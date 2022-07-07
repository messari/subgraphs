import { Address, ethereum } from "@graphprotocol/graph-ts";
import { getOrCreateProtocol } from "../entities/protocol";
import {
  Account,
  ActiveAccount,
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../utils/constants";

export function updateUsageMetrics(block: ethereum.Block, from: Address): void {
  const accountId = from.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    const protocol = getOrCreateProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  const protocol = getOrCreateProtocol();
  const usageMetricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const usageMetricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(
    block
  );

  usageMetricsDailySnapshot.dailyTransactionCount += 1;
  usageMetricsHourlySnapshot.hourlyTransactionCount += 1;

  usageMetricsDailySnapshot.cumulativeUniqueUsers =
    protocol.cumulativeUniqueUsers;
  usageMetricsHourlySnapshot.cumulativeUniqueUsers =
    protocol.cumulativeUniqueUsers;

  let dailyActiveAccountId = (block.timestamp.toI64() / SECONDS_PER_DAY)
    .toString()
    .concat("-")
    .concat(accountId);

  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();

    usageMetricsDailySnapshot.dailyActiveUsers += 1;
    usageMetricsHourlySnapshot.hourlyActiveUsers += 1;
  }

  usageMetricsDailySnapshot.blockNumber = block.number;
  usageMetricsHourlySnapshot.blockNumber = block.number;

  usageMetricsDailySnapshot.timestamp = block.timestamp;
  usageMetricsHourlySnapshot.timestamp = block.timestamp;

  usageMetricsDailySnapshot.save();
  usageMetricsHourlySnapshot.save();
}

export function getOrCreateUsageMetricsDailySnapshot(
  block: ethereum.Block
): UsageMetricsDailySnapshot {
  let dayId: string = (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(dayId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(dayId);

    usageMetrics.protocol = protocol.id;
    usageMetrics.totalPoolCount = protocol.totalPoolCount;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;
  }

  usageMetrics.save();

  return usageMetrics;
}

export function getOrCreateUsageMetricsHourlySnapshot(
  block: ethereum.Block
): UsageMetricsHourlySnapshot {
  let hourId: string = (block.timestamp.toI64() / SECONDS_PER_HOUR).toString();
  let usageMetrics = UsageMetricsHourlySnapshot.load(hourId);

  if (!usageMetrics) {
    const protocol = getOrCreateProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(hourId);

    usageMetrics.protocol = protocol.id;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.hourlyTransactionCount = 0;

    usageMetrics.blockNumber = block.number;
    usageMetrics.timestamp = block.timestamp;
  }

  usageMetrics.save();

  return usageMetrics;
}

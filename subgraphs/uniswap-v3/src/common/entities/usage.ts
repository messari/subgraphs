import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../configurations/configure";
import {
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../../generated/schema";
import { SECONDS_PER_DAY, INT_ZERO, SECONDS_PER_HOUR } from "../constants";

export function getOrCreateUsageMetricDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(Bytes.fromI32(day));

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(Bytes.fromI32(day));
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.days = INT_ZERO;
    usageMetrics.dailyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.dailyTransactionCount = INT_ZERO;
    usageMetrics.dailyDepositCount = INT_ZERO;
    usageMetrics.dailyWithdrawCount = INT_ZERO;
    usageMetrics.dailySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.totalPoolCount = 0;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateUsageMetricHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of days since Unix epoch
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  // Create unique id for the day
  let usageMetrics = UsageMetricsHourlySnapshot.load(Bytes.fromI32(hour));

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsHourlySnapshot(Bytes.fromI32(hour));
    usageMetrics.protocol = NetworkConfigs.getFactoryAddress();

    usageMetrics.hours = INT_ZERO;
    usageMetrics.hourlyActiveUsers = INT_ZERO;
    usageMetrics.cumulativeUniqueUsers = INT_ZERO;
    usageMetrics.hourlyTransactionCount = INT_ZERO;
    usageMetrics.hourlyDepositCount = INT_ZERO;
    usageMetrics.hourlyWithdrawCount = INT_ZERO;
    usageMetrics.hourlySwapCount = INT_ZERO;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }

  return usageMetrics;
}

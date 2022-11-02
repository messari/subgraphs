import { ethereum } from "@graphprotocol/graph-ts";
import {
  UsageMetricsDailySnapshot,
  UsageMetricsHourlySnapshot,
} from "../../generated/schema";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../common/constants";
import { getOrCreateLendingProtocol } from "./protocol";

export function getOrCreateUsageMetricsHourlySnapshot(
  event: ethereum.Event
): UsageMetricsHourlySnapshot {
  // Number of hours since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;

  // Create unique id for the hour
  let usageMetrics = UsageMetricsHourlySnapshot.load(id.toString());

  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsHourlySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;

    usageMetrics.hourlyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

    usageMetrics.hourlyTransactionCount = 0;
    usageMetrics.hourlyDepositCount = 0;
    usageMetrics.hourlyBorrowCount = 0;
    usageMetrics.hourlyWithdrawCount = 0;
    usageMetrics.hourlyRepayCount = 0;
    usageMetrics.hourlyLiquidateCount = 0;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }
  return usageMetrics;
}

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  const id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    const protocol = getOrCreateLendingProtocol();
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = getOrCreateLendingProtocol().id;

    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.dailyDepositCount = 0;
    usageMetrics.dailyBorrowCount = 0;
    usageMetrics.dailyWithdrawCount = 0;
    usageMetrics.dailyRepayCount = 0;
    usageMetrics.dailyLiquidateCount = 0;
    usageMetrics.totalPoolCount = 0;

    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.dailyActiveDepositors = 0;
    usageMetrics.dailyActiveBorrowers = 0;
    usageMetrics.dailyActiveLiquidators = 0;
    usageMetrics.dailyActiveLiquidatees = 0;

    usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
    usageMetrics.cumulativeUniqueDepositors =
      protocol.cumulativeUniqueDepositors;
    usageMetrics.cumulativeUniqueBorrowers = protocol.cumulativeUniqueBorrowers;
    usageMetrics.cumulativeUniqueLiquidators =
      protocol.cumulativeUniqueLiquidators;
    usageMetrics.cumulativeUniqueLiquidatees =
      protocol.cumulativeUniqueLiquidatees;

    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;

    usageMetrics.save();
  }
  return usageMetrics;
}

import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  VaultDailySnapshot,
} from "../generated/schema";
import { Address, ethereum } from "@graphprotocol/graph-ts";
import { getDay } from "./utils";
import { getOrCreateYieldAggregator } from "./entities";

export function getOrCreateUsageMetricsDailySnapshot(
  event: ethereum.Event
): UsageMetricsDailySnapshot {
  const day = getDay(event.block.timestamp);
  const protocol = getOrCreateYieldAggregator();
  let object = UsageMetricsDailySnapshot.load(day.toString());

  if (!object) {
    object = new UsageMetricsDailySnapshot(day.toString());

    object.protocol = protocol.id;
    object.activeUsers = 1;
    object.dailyTransactionCount = 1;
  } else {
    object.activeUsers += 1;
    object.dailyTransactionCount += 1;
  }

  object.totalUniqueUsers = protocol.totalUniqueUsers;
  object.blockNumber = event.block.number;
  object.timestamp = event.block.timestamp;

  object.save();

  return object;
}

export function getOrCreateFinancialsDailySnapshot(
  event: ethereum.Event
): FinancialsDailySnapshot {
  const day = getDay(event.block.timestamp);
  const protocol = getOrCreateYieldAggregator();
  let object = FinancialsDailySnapshot.load(day.toString());

  if (!object) {
    object = new FinancialsDailySnapshot(day.toString());
    object.protocol = protocol.id;
  }

  object.totalVolumeUSD = protocol.totalVolumeUSD;
  object.totalValueLockedUSD = protocol.totalValueLockedUSD;
  object.totalRevenueUSD = protocol.totalValueLockedUSD;
  object.blockNumber = event.block.number;
  object.timestamp = event.block.timestamp;

  object.save();

  return object;
}

export function updateAllSnapshots(
  event: ethereum.Event,
  vaultAddress: Address
): void {
  getOrCreateUsageMetricsDailySnapshot(event);
  getOrCreateFinancialsDailySnapshot(event);
}

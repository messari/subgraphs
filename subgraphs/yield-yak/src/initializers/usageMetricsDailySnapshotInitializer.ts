import { BigInt, Address } from "@graphprotocol/graph-ts";
import { UsageMetricsDailySnapshot } from "../../generated/schema";
import { initProtocol } from "./protocolInitializer";
import { ZERO_INT } from "../helpers/constants";

export function initUsageMetricsDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsDailySnapshot {
  const protocol = initProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  let usageMetricsDailySnapshotEntity = UsageMetricsDailySnapshot.load(daysFromStart.toString());

  if (usageMetricsDailySnapshotEntity == null) {
    usageMetricsDailySnapshotEntity = new UsageMetricsDailySnapshot(daysFromStart.toString());
    usageMetricsDailySnapshotEntity.timestamp = timestamp;
    usageMetricsDailySnapshotEntity.blockNumber = blockNumber;
    usageMetricsDailySnapshotEntity.protocol = protocol.id;
    usageMetricsDailySnapshotEntity.totalPoolCount = protocol.totalPoolCount;
    usageMetricsDailySnapshotEntity.dailyActiveUsers = ZERO_INT;
    usageMetricsDailySnapshotEntity.cumulativeUniqueUsers = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyTransactionCount = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyDepositCount = ZERO_INT;
    usageMetricsDailySnapshotEntity.dailyWithdrawCount = ZERO_INT;
  }

  usageMetricsDailySnapshotEntity.save();
  return usageMetricsDailySnapshotEntity;
}
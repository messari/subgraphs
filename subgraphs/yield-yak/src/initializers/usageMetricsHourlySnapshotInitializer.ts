import { BigInt, Address } from "@graphprotocol/graph-ts";
import { UsageMetricsHourlySnapshot } from "../../generated/schema";
import { initProtocol } from "./protocolInitializer";
import { ZERO_INT } from "../helpers/constants";

export function initUsageMetricsHourlySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): UsageMetricsHourlySnapshot {
  const protocol = initProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60;
  const hourInDay = (timestamp.toI32() - daysFromStart * 24 * 60 * 60) / 60 / 60;
  let usageMetricsHourlySnapshotEntity = UsageMetricsHourlySnapshot.load(daysFromStart.toString().concat("-").concat(hourInDay.toString()));

  if (usageMetricsHourlySnapshotEntity == null) {
    usageMetricsHourlySnapshotEntity = new UsageMetricsHourlySnapshot(daysFromStart.toString().concat("-").concat(hourInDay.toString()));
    usageMetricsHourlySnapshotEntity.timestamp = timestamp;
    usageMetricsHourlySnapshotEntity.blockNumber = blockNumber;
    usageMetricsHourlySnapshotEntity.protocol = protocol.id;
    usageMetricsHourlySnapshotEntity.hourlyActiveUsers = ZERO_INT;
    usageMetricsHourlySnapshotEntity.cumulativeUniqueUsers = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyTransactionCount = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyDepositCount = ZERO_INT;
    usageMetricsHourlySnapshotEntity.hourlyWithdrawCount = ZERO_INT;
  }

  usageMetricsHourlySnapshotEntity.save();
  return usageMetricsHourlySnapshotEntity;
}
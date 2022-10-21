import { BigInt, Address } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot } from "../../generated/schema";
import { initProtocol } from "./protocolInitializer";
import { ZERO_BIGDECIMAL } from "../helpers/constants";

export function initFinancialsDailySnapshot(
  timestamp: BigInt,
  blockNumber: BigInt,
  contractAddress: Address,
): FinancialsDailySnapshot {
  const protocol = initProtocol(contractAddress);
  const daysFromStart = timestamp.toI32() / 24 / 60 / 60
  let financialsDailySnapshotEntity = FinancialsDailySnapshot.load(daysFromStart.toString());

  if (financialsDailySnapshotEntity == null) {
    financialsDailySnapshotEntity = new FinancialsDailySnapshot(daysFromStart.toString());
    financialsDailySnapshotEntity.timestamp = timestamp;
    financialsDailySnapshotEntity.blockNumber = blockNumber;
    financialsDailySnapshotEntity.protocol = protocol.id;
    financialsDailySnapshotEntity.protocolControlledValueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.totalValueLockedUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailySupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeSupplySideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailyProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeProtocolSideRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.dailyTotalRevenueUSD = ZERO_BIGDECIMAL;
    financialsDailySnapshotEntity.cumulativeTotalRevenueUSD = ZERO_BIGDECIMAL;
  }

  financialsDailySnapshotEntity.save();

  return financialsDailySnapshotEntity;
}
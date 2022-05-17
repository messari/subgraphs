import { Address, BigInt } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, YieldAggregator } from "../../generated/schema";
import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY } from "./constants";
import { getOrCreateProtocol } from "./protocol";
import { getOrCreateVault } from "./vaults";

export function getOrCreateFinancialMetrics(timestamp: BigInt, blockNumber: BigInt): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;

    financialMetrics.protocolControlledValueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}

export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  let financialMetrics = getOrCreateFinancialMetrics(timestamp, blockNumber);
  const protocol = getOrCreateProtocol();

  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;

  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;

  financialMetrics.save();
}

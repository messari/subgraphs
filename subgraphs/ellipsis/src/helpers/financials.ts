import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  DexAmmProtocol,
  FinancialsDailySnapshot,
} from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  SECONDS_PER_DAY,
} from "../utils/constant";

export function getOrCreateFinancials(
  protocol: DexAmmProtocol,
  timestamp: BigInt,
  blockNumber: BigInt
): FinancialsDailySnapshot {

  // Number of days since Unix epoch
  let id = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  if (financialMetrics == null) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = protocol.id;
    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;
    financialMetrics.save();
    
    return financialMetrics as FinancialsDailySnapshot
  }
  return financialMetrics as FinancialsDailySnapshot
}


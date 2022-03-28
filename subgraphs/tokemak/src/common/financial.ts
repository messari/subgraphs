import { BigInt } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot } from "../../generated/schema";
import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY } from "./constants";

export function getOrCreateFinancialMetrics(timestamp: BigInt): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = PROTOCOL_ID;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.save();
  }
  return financialMetrics;
}

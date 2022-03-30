// get or create snapshots and metrics

import { ethereum } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, LendingProtocol, MarketDailySnapshot, UsageMetricsDailySnapshot } from "../types/schema";
import { BIGDECIMAL_ZERO, COMPTROLLER_ADDRESS, LENDING_TYPE, NETWORK_ETHEREUM, PROTOCOL_NAME, PROTOCOL_RISK_TYPE, PROTOCOL_SLUG, PROTOCOL_TYPE, SCHEMA_VERSION, SECONDS_PER_DAY, SUBGRAPH_VERSION } from "./utils/constants";

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Create unique id for the day
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = COMPTROLLER_ADDRESS;

        usageMetrics.activeUsers = 0;
        usageMetrics.totalUniqueUsers = 0;
        usageMetrics.dailyTransactionCount = 0;
        usageMetrics.save();
    }

    return usageMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    let marketAddress = event.address.toHexString(); // TODO: might not be able to do this
    let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));
  
    if (!marketMetrics) {
      marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
      marketMetrics.protocol = COMPTROLLER_ADDRESS;
      marketMetrics.market = marketAddress;
      marketMetrics.rewardTokenEmissionsAmount = [];
      marketMetrics.rewardTokenEmissionsUSD = [];
  
      marketMetrics.save();
    }
  
    return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot { 
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = COMPTROLLER_ADDRESS;

    financialMetrics.feesUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;

    financialMetrics.save();
  }
  return financialMetrics;
}

////////////////////////////
///// Lending Specific /////
////////////////////////////

export function getOrCreateLendingProtcol(): LendingProtocol {
    let protocol = LendingProtocol.load(COMPTROLLER_ADDRESS);
  
    if (!protocol) {
        protocol = new LendingProtocol(COMPTROLLER_ADDRESS);
        protocol.name = PROTOCOL_NAME;
        protocol.slug = PROTOCOL_SLUG;
        protocol.schemaVersion = SCHEMA_VERSION;
        protocol.subgraphVersion = SUBGRAPH_VERSION;
        protocol.network = NETWORK_ETHEREUM;
        protocol.type = PROTOCOL_TYPE;
        protocol.totalUniqueUsers = 0 as i32;
        protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
        protocol.lendingType = LENDING_TYPE;
        protocol.riskType = PROTOCOL_RISK_TYPE;
  
        protocol.save();
    }
    return protocol;
  }

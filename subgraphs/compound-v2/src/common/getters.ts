// get or create snapshots and metrics

import { ethereum } from "@graphprotocol/graph-ts";
import { FinancialsDailySnapshot, MarketDailySnapshot, UsageMetricsDailySnapshot } from "../types/schema";

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
    
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {

}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot { 
    
}
import { BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateProtocol } from "./protocol";
import { FinancialsDailySnapshot } from "../generated/schema";
import { bigIntToBigDecimal } from "./utils/numbers";
import {
    BIGDECIMAL_ZERO,
    PROTOCOL_CONTRACT,
    SECONDS_PER_DAY
} from "./utils/constants";

// event.params not available when passing event: ethereum.Event
export function updateFinancialMetrics(block: ethereum.Block, amount: BigInt): void {
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailySnapshot(block);

    // update protocol metrics
    log.info(" --------------> Before: Logging amount: {}", [amount.toString()]);
    log.info(" --------------> Before: Logging amount: {}", [bigIntToBigDecimal(amount).toString()]);
    log.info(" --------------> Before: Logging protocol TVL: {}", [protocol.totalValueLockedUSD.toString()]);
    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(bigIntToBigDecimal(amount));
    log.info(" --------------> After: Logging amount: {}", [amount.toString()]);
    log.info(" --------------> After: Logging protocol TVL: {}", [protocol.totalValueLockedUSD.toString()]);
    // protocol.cumulativeSupplySideRevenueUSD = getSupplySide
    // protocol.cumulativeProtocolSideRevenueUSD =
    // protocol.cumulativeTotalRevenueUSD =
    protocol.save();


    // update financials daily snapshot
    // let's get everything in ETH first
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  
    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;
  
    financialMetrics.save();
}

export function getOrCreateFinancialDailySnapshot(
    block: ethereum.Block
  ): FinancialsDailySnapshot {
    // Number of days since Unix epoch
    const id = `${block.timestamp.toI64() / SECONDS_PER_DAY}`;
    let financialMetrics = FinancialsDailySnapshot.load(id);

    if (!financialMetrics) {
      financialMetrics = new FinancialsDailySnapshot(id);
      financialMetrics.protocol = PROTOCOL_CONTRACT;
    }
    // TVL
    // SUM (submits) * ETH price (offchain)
    financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;

    // TOTAL REVENUE
    // Staking Rewards - 10%
    financialMetrics.dailyTotalRevenueUSD = BIGDECIMAL_ZERO;
    // SUM of Daily Total Revenue
    financialMetrics.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;

    // PROTOCOL REVENUE
    // Protocol Revenue = Treasure Revenue + Node Operators Revenue 
    // 5% - insurance ?
    // Why is this not equal to the staking rewards amount (i,e 10%)?
    financialMetrics.dailyProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    // SUM of Daily Protocol Side Revenue
    financialMetrics.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;

    // SUPPLY REVENUE
    // Staking Rewards - Protocol Revenue
    financialMetrics.dailySupplySideRevenueUSD = BIGDECIMAL_ZERO;
    // SUM of Daily Supply Side Revenue
    financialMetrics.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    
    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
    
    return financialMetrics;
}

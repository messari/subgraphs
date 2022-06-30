import { Address, BigDecimal, bigInt, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { getOrCreateProtocol } from "./protocol";
import { FinancialsDailySnapshot, Protocol } from "../generated/schema";
import { bigIntToBigDecimal } from "./utils/numbers";
import {
    BIGDECIMAL_ZERO,
    PROTOCOL_CONTRACT,
    SECONDS_PER_DAY,
} from "./utils/constants";

// TODO
// 1. Update financialMetrics to USD from ETH (dependency on getUSD price)
// 2. How do we factor in slashing here? Will it be -value?

export function updateFinancialMetrics(block: ethereum.Block, amount: BigInt): void {
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailySnapshot(block);

    financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  
    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;
  
    financialMetrics.save();
}

export function updateTotalValueLockedUSD(block: ethereum.Block, amount: BigInt): void {
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailySnapshot(block);

    protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(bigIntToBigDecimal(amount));
    protocol.save();

    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
    financialMetrics.save();
}

export function updateTotalRevenueMetrics(block: ethereum.Block, postTotalPooledEther: BigInt, preTotalPooledEther: BigInt): void {
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailySnapshot(block);

    const stakedRewards = bigIntToBigDecimal(postTotalPooledEther.minus(preTotalPooledEther));
    protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(stakedRewards);
    protocol.save();

    financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(stakedRewards); 
    financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
    financialMetrics.save();
}

export function updateProtocolSideRevenueMetrics(block: ethereum.Block, recipient: Address, amount: BigInt): void {
    const protocol = getOrCreateProtocol();
    const financialMetrics = getOrCreateFinancialDailySnapshot(block);
    log.info(" ~~~~~~~ logging Transfer: {} {}", [recipient.toString(), amount.toString()])

    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(bigIntToBigDecimal(amount));
    protocol.save();

    financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(bigIntToBigDecimal(amount)); 
    financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
    financialMetrics.save();
}

// TODO/FIX: How will trigger this from two separate places? lido.sol.staking_rewards - stETH.protocol_revenue
// assuming this should work because we use block as our ID to join things on
export function updateSupplySideRevenueMetrics(): void {

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
    
    }

    financialMetrics.blockNumber = block.number;
    financialMetrics.timestamp = block.timestamp;

    financialMetrics.save();
    
    return financialMetrics;
}

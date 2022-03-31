// import { log } from "@graphprotocol/graph-ts"
import { BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts"

import {
  _HelperStore,
  _TokenTracker,
  _Account,
  _DailyActiveAccount,
  UsageMetricsDailySnapshot
} from "../../generated/schema"
import { FACTORY_ADDRESS, SECONDS_PER_DAY } from "./constants";
import { getLiquidityPool, getOrCreateDex, getOrCreateFinancials, getOrCreatePoolDailySnapshot, getOrCreateUsersHelper } from "./getters";


// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {

    let financialMetrics = getOrCreateFinancials(event);
    let protocol = getOrCreateDex()
    
    // Update the block number and timestamp to that of the last transaction of that day
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;
    financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD
  
    financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
    let totalUniqueUsers = getOrCreateUsersHelper()
  
    if (!usageMetrics) {
      usageMetrics = new UsageMetricsDailySnapshot(id.toString());
      usageMetrics.protocol = FACTORY_ADDRESS
      usageMetrics.activeUsers = 0;
      usageMetrics.totalUniqueUsers = 0;
      usageMetrics.dailyTransactionCount = 0;
    }
    
    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.dailyTransactionCount += 1;
  
    let accountId = from.toHexString()
    let account = _Account.load(accountId)
    if (!account) {
      account = new _Account(accountId);
      account.save();
      totalUniqueUsers.valueInt += 1;
    }
    usageMetrics.totalUniqueUsers = totalUniqueUsers.valueInt;
  
    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
    let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
    if (!dailyActiveAccount) {
      dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
      dailyActiveAccount.save();
      usageMetrics.activeUsers += 1
    }
  
    totalUniqueUsers.save();
    usageMetrics.save();
  }
  
// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {

    // get or create pool metrics
    let poolMetrics = getOrCreatePoolDailySnapshot(event)
    let pool = getLiquidityPool(event.address.toHexString())
      
    // Update the block number and timestamp to that of the last transaction of that day
    poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
    poolMetrics.inputTokenBalances = pool.inputTokenBalances
    poolMetrics.outputTokenSupply = pool.outputTokenSupply
    poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD
    poolMetrics.blockNumber = event.block.number;
    poolMetrics.timestamp = event.block.timestamp;
  
    poolMetrics.save();
}

// Update the volume and accrued fees for all relavant entities 
export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, tradingFeeAmountUSD: BigDecimal, protocolFeeAmountUSD: BigDecimal): void {
    let pool = getLiquidityPool(event.address.toHexString())
    let poolMetrics = getOrCreatePoolDailySnapshot(event);
    let financialMetrics = getOrCreateFinancials(event);
  
    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(tradingFeeAmountUSD).plus(protocolFeeAmountUSD)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(tradingFeeAmountUSD)
    financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(protocolFeeAmountUSD)

    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)
  
    poolMetrics.save();
    financialMetrics.save()
    pool.save()
}

import { BigDecimal, Address, log, ethereum } from "@graphprotocol/graph-ts"

import {
  _HelperStore,
  _TokenTracker,
  _Account,
  _DailyActiveAccount
} from "../../generated/schema"
import { INT_ONE, SECONDS_PER_DAY} from "../common/constants"
import { getLiquidityPool, getOrCreateDex, getOrCreateFinancials, getOrCreatePoolDailySnapshot, getOrCreateUsageMetricSnapshot, getOrCreateUsersHelper } from "./getters";


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

    let usageMetrics = getOrCreateUsageMetricSnapshot(event) 
    let uniqueUsersTotal = getOrCreateUsersHelper()

    if (createAndIncrementAccount(from) == true){
        uniqueUsersTotal.valueInt += INT_ONE
    }
    if (createAndIncrementDailyAccount(event, from) == true){
        usageMetrics.totalUniqueUsers += INT_ONE
    }
  
    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.dailyTransactionCount += 1;
    usageMetrics.totalUniqueUsers = uniqueUsersTotal.valueInt

      
    usageMetrics.save()
}
  
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
  
  export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, feeUSD: BigDecimal): void {
    let pool = getLiquidityPool(event.address.toHexString())
    let poolMetrics = getOrCreatePoolDailySnapshot(event);
    let financialMetrics = getOrCreateFinancials(event);
  
    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(feeUSD)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(feeUSD)
  
    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)
  
    poolMetrics.save();
    financialMetrics.save()
    pool.save()
}

export function createAndIncrementAccount(accountId: Address): bool {
    let account = _Account.load(accountId.toHexString())
    if (!account) {
        account = new _Account(accountId.toHexString());
        account.save();

        return true
    } 
    return false
}

export function createAndIncrementDailyAccount(event: ethereum.Event, accountId: Address): bool {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + accountId.toHexString()
    let account = _DailyActiveAccount.load(dailyActiveAccountId)
    if (!account) {
        account = new _DailyActiveAccount(accountId.toHexString());
        account.save();
        
        return true
    } 
    return false
}
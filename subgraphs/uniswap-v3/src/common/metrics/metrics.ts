// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts"
import { FACTORY_ADDRESS } from "../../../config/_paramConfig";
import {
  _HelperStore,
  _TokenTracker,
  Account,
  DailyActiveAccount,
  UsageMetricsDailySnapshot
} from "../../../generated/schema"
import { INT_ONE, INT_ZERO, SECONDS_PER_DAY} from "../utils/constants"
import { getLiquidityPool, getOrCreateDex, getOrCreateFinancials, getOrCreatePoolDailySnapshot, getOrCreateUsersHelper } from "./../getters";


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
    let protocol = getOrCreateDex()
    let totalUniqueUsers = getOrCreateUsersHelper()
  
    if (!usageMetrics) {
      usageMetrics = new UsageMetricsDailySnapshot(id.toString());
      usageMetrics.protocol = FACTORY_ADDRESS
      usageMetrics.activeUsers = INT_ZERO;
      usageMetrics.totalUniqueUsers = INT_ZERO;
      usageMetrics.dailyTransactionCount = INT_ZERO;
    }
    
    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.dailyTransactionCount += 1;
  
    let accountId = from.toHexString()
    let account = Account.load(accountId)
    if (!account) {
      account = new Account(accountId);
      account.save();
      totalUniqueUsers.valueInt += INT_ONE;
    }
    usageMetrics.totalUniqueUsers = totalUniqueUsers.valueInt;
    protocol.totalUniqueUsers = totalUniqueUsers.valueInt
  
    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
    let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
    if (!dailyActiveAccount) {
      dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
      dailyActiveAccount.save();
      usageMetrics.activeUsers += INT_ONE
    }
  
    totalUniqueUsers.save();
    usageMetrics.save();
    protocol.save()
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
export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, feeUSD: BigDecimal): void {
    let pool = getLiquidityPool(event.address.toHexString())
    let poolMetrics = getOrCreatePoolDailySnapshot(event);
    let protocol = getOrCreateDex()
    let financialMetrics = getOrCreateFinancials(event);
  
    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(feeUSD)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(feeUSD)
  
    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)
    protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(trackedAmountUSD)
  
    financialMetrics.save()
    poolMetrics.save();
    protocol.save()
    pool.save()
}

// Create Account entity for participating account 
export function createAndIncrementAccount(accountId: Address): bool {
    let account = Account.load(accountId.toHexString())
    if (!account) {
        account = new Account(accountId.toHexString());
        account.save();

        return true
    } 
    return false
}

// Create DailyActiveAccount entity for participating account
export function createAndIncrementDailyAccount(event: ethereum.Event, accountId: Address): bool {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + accountId.toHexString()
    let account = DailyActiveAccount.load(dailyActiveAccountId)
    if (!account) {
        account = new DailyActiveAccount(accountId.toHexString());
        account.save();
        
        return true
    } 
    return false
}
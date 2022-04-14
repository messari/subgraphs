// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, Address, ethereum } from "@graphprotocol/graph-ts"
import { NetworkParameters } from "../../config/_paramConfig";
import { UsageMetricsDailySnapshot, Account, DailyActiveAccount, _TokenTracker } from "../../generated/schema";
import { Pool } from "../../generated/templates/Pool/Pool";
import { SECONDS_PER_DAY, INT_ZERO, INT_ONE, BIGDECIMAL_ONE } from "./constants";
import { getOrCreateFinancials, getOrCreateDex, getOrCreateUsersHelper, getOrCreatePoolDailySnapshot, getLiquidityPool, getOrCreateTokenTracker, getOrCreateEtherHelper, getLiquidityPoolFee } from "./getters";
import { getEthPriceInUSD, findEthPerToken } from "./price/price";


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
      usageMetrics.protocol = NetworkParameters.FACTORY_ADDRESS
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

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations. 
export function UpdateTokenWhitelists(tokenTracker0: _TokenTracker, tokenTracker1: _TokenTracker, poolAddress: Address): void {
  // update white listed pools
  if (NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker0.id)) {
    let newPools = tokenTracker1.whitelistPools
    newPools.push(poolAddress.toHexString())
    tokenTracker1.whitelistPools = newPools
    tokenTracker1.save()
  }

  if (NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    let newPools = tokenTracker0.whitelistPools
    newPools.push(poolAddress.toHexString())
    tokenTracker0.whitelistPools = newPools
    tokenTracker0.save()
  }
}

export function updatePrices(event: ethereum.Event): void {
  let pool = getLiquidityPool(event.address.toHexString())

  // Retrieve token Trackers
  let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
  let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))

  // update ETH price now that prices could have changed
  let ether = getOrCreateEtherHelper()
  ether.valueDecimal = getEthPriceInUSD()

  // update token prices
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0 as _TokenTracker)
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1 as _TokenTracker)
  
  tokenTracker0.save()
  tokenTracker1.save()
  ether.save()
}

// Update the volume and accrued fees for all relavant entities 
export function updateVolumeAndFees(event: ethereum.Event, trackedAmountUSD: BigDecimal, tradingFeeUSD: BigDecimal, protocolFeeUSD: BigDecimal): void {
  let pool = getLiquidityPool(event.address.toHexString())
  let protocol = getOrCreateDex()
  let poolMetrics = getOrCreatePoolDailySnapshot(event)
  let financialMetrics = getOrCreateFinancials(event)

  financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
  financialMetrics.totalRevenueUSD = financialMetrics.totalRevenueUSD.plus(tradingFeeUSD).plus(protocolFeeUSD)
  financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(tradingFeeUSD)
  financialMetrics.protocolSideRevenueUSD = financialMetrics.protocolSideRevenueUSD.plus(protocolFeeUSD)

  poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
  pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)
  protocol.totalVolumeUSD = protocol.totalVolumeUSD.plus(trackedAmountUSD)

  pool.save()
  protocol.save()
  poolMetrics.save()
  financialMetrics.save()
}

export function updateProtocolFees(event: ethereum.Event): void {
  let poolContract = Pool.bind(event.address)
  let pool = getLiquidityPool(event.address.toString())

  let tradingFee = getLiquidityPoolFee(pool.fees[0])
  let protocolFee = getLiquidityPoolFee(pool.fees[1])

  // Get the total proportion of swap value collected as a fee
  let totalPoolFee = tradingFee.feePercentage.plus(protocolFee.feePercentage)

  // Value5 is the feeProtocol variabe in the slot0 struct of the pool contract 
  let feeProtocol = poolContract.slot0().value5
  let protocolFeeProportion = BIGDECIMAL_ONE.div(BigDecimal.fromString(feeProtocol.toString()))

  // Update protocol and trading fees for this pool
  tradingFee.feePercentage = totalPoolFee.times(BIGDECIMAL_ONE.minus(protocolFeeProportion))
  protocolFee.feePercentage = totalPoolFee.times(protocolFeeProportion)

  tradingFee.save()
  protocolFee.save()
}
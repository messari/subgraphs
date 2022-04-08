// import { log } from '@graphprotocol/graph-ts'
import { Address, ethereum } from "@graphprotocol/graph-ts"
import {
  DexAmmProtocol,
  LiquidityPool,
  _Account,
  _DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
} from "../../generated/schema"

import { BIGDECIMAL_ZERO, HelperStoreType, INT_ZERO, FACTORY_ADDRESS, ProtocolType, SECONDS_PER_DAY, deployedNetwork } from "../common/constants"

export function getOrCreateEtherHelper(): _HelperStore {
    let ether = _HelperStore.load(HelperStoreType.ETHER)
    if (ether === null) {
        ether = new _HelperStore(HelperStoreType.ETHER)
        ether.valueDecimal = BIGDECIMAL_ZERO
        ether.save()
    }
    return ether
}
export function getOrCreateUsersHelper(): _HelperStore {
    let uniqueUsersTotal = _HelperStore.load(HelperStoreType.USERS)
    if (uniqueUsersTotal === null) {
        uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS)
        uniqueUsersTotal.valueDecimal = BIGDECIMAL_ZERO
        uniqueUsersTotal.save()
    }
    return uniqueUsersTotal
}

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)

  if (protocol === null) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS)
    protocol.name = "Uniswap v3"
    protocol.slug = "uniswap-v3"
    protocol.schemaVersion = "1.0.1"
    protocol.subgraphVersion = "1.0.0"
    protocol.totalUniqueUsers = INT_ZERO
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
    protocol.network = deployedNetwork
    protocol.type = ProtocolType.EXCHANGE

    protocol.save()

    // create new ether price storage object
    let ether = getOrCreateEtherHelper()

    // Tracks the total number of unique users of the protocol 
    let uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS)
    uniqueUsersTotal.valueInt = INT_ZERO
    uniqueUsersTotal.save()
  }  
  return protocol
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
    return LiquidityPool.load(poolAddress)!
}

export function getLiquidityPoolAmounts(poolAddress: string): _LiquidityPoolAmount {
    return _LiquidityPoolAmount.load(poolAddress)!
}

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
    return LiquidityPoolFee.load(id)!
}


export function getFeeTier(event: ethereum.Event): _HelperStore {
    return _HelperStore.load(event.address.toHexString().concat("-FeeTier"))!
}

export function getOrCreateTokenTracker(tokenAddress: Address): _TokenTracker {
    let tokenTracker = _TokenTracker.load(tokenAddress.toHexString())
    // fetch info if null
    if (tokenTracker === null) {

        tokenTracker = new _TokenTracker(tokenAddress.toHexString())

        tokenTracker.whitelistPools = []
        tokenTracker.save()
    }

    return tokenTracker
}

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot{
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    // Create unique id for the day
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
  
    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = FACTORY_ADDRESS;
  
        usageMetrics.activeUsers = 0;
        usageMetrics.totalUniqueUsers = 0;
        usageMetrics.dailyTransactionCount = 0;
        usageMetrics.save()
    }

    return usageMetrics
}

export function getOrCreatePoolDailySnapshot(event: ethereum.Event): PoolDailySnapshot {
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
    let poolAddress = event.address.toHexString()
    let poolMetrics = PoolDailySnapshot.load(poolAddress.concat("-").concat(id.toString()));
    
    if (!poolMetrics) {
        poolMetrics = new PoolDailySnapshot(poolAddress.concat("-").concat(id.toString()));
        poolMetrics.protocol = FACTORY_ADDRESS;
        poolMetrics.pool = poolAddress;
        poolMetrics.rewardTokenEmissionsAmount = []
        poolMetrics.rewardTokenEmissionsUSD = []

        poolMetrics.save()
    }

    return poolMetrics
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
    // Number of days since Unix epoch
    let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

    let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  
    if (!financialMetrics) {
        financialMetrics = new FinancialsDailySnapshot(id.toString());
        financialMetrics.protocol = FACTORY_ADDRESS;
  
        financialMetrics.feesUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO

        financialMetrics.save()
    }
    return financialMetrics
}
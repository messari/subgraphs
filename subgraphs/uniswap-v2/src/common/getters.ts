// import { log } from "@graphprotocol/graph-ts"
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import {
  Token,
  DexAmmProtocol,
  LiquidityPool,
  _Account,
  _DailyActiveAccount,
  _HelperStore,
  _TokenTracker,
  _Transaction,
  _Mint,
  _Burn,
  UsageMetricsDailySnapshot,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  _LiquidityPoolAmounts
} from "../../generated/schema"
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from './tokens'
import { BIGDECIMAL_ZERO, HelperStoreType, Network, INT_ZERO, FACTORY_ADDRESS, ProtocolType, SECONDS_PER_DAY, BIGINT_ZERO, INT_ONE } from "../common/constants"

export function getOrCreateEtherHelper(): _HelperStore {
    let ether = _HelperStore.load(HelperStoreType.ETHER)
    if (!ether) {
        ether = new _HelperStore(HelperStoreType.ETHER)
        ether.valueDecimal = BIGDECIMAL_ZERO
        ether.save()
    }
    return ether
}
export function getOrCreateUsersHelper(): _HelperStore {
    let uniqueUsersTotal = _HelperStore.load(HelperStoreType.USERS)
    if (!uniqueUsersTotal) {
        uniqueUsersTotal = new _HelperStore(HelperStoreType.USERS)
        uniqueUsersTotal.valueInt = INT_ZERO
        uniqueUsersTotal.save()
    }
    return uniqueUsersTotal
}

export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)

  if (!protocol) {
    protocol = new DexAmmProtocol(FACTORY_ADDRESS)
    protocol.name = "Uniswap v2"
    protocol.slug = "uniswap-v2"
    protocol.version = "1.0.0"
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
    protocol.network = Network.ETHEREUM
    protocol.type = ProtocolType.EXCHANGE

    protocol.save()
  }  
  return protocol
}

export function getLiquidityPool(poolAddress: string): LiquidityPool {
    return LiquidityPool.load(poolAddress)!
}

export function getLiquidityPoolAmounts(poolAddress: string): _LiquidityPoolAmounts {
    return _LiquidityPoolAmounts.load(poolAddress)!
}

export function getOrCreateToken(tokenAddress: Address): Token {
    let token = Token.load(tokenAddress.toHexString())
    // fetch info if null
    if (!token) {
        token = new Token(tokenAddress.toHexString())
        token.symbol = fetchTokenSymbol(tokenAddress)
        token.name = fetchTokenName(tokenAddress)
        token.decimals = fetchTokenDecimals(tokenAddress)
        token.save()
    }
    return token
}

export function getOrCreateTokenTracker(tokenAddress: Address): _TokenTracker {
    let tokenTracker = _TokenTracker.load(tokenAddress.toHexString())
    // fetch info if null
    if (!tokenTracker) {

        tokenTracker = new _TokenTracker(tokenAddress.toHexString())

        tokenTracker.whitelistPools = []
        tokenTracker.save()
    }

    return tokenTracker
}

export function getMint(id: string): _Mint {
    return _Mint.load(id)!
}

export function getBurn(id: string): _Burn {
    return _Burn.load(id)!
}

export function getOrCreateTransaction(event: ethereum.Event): _Transaction {
    let transactionHash = event.transaction.hash.toHexString()
    let transaction = _Transaction.load(transactionHash)
    if (!transaction) {    
        transaction = new _Transaction(transactionHash)
        transaction.blockNumber = event.block.number
        transaction.timestamp = event.block.timestamp
    }
    transaction.save()
    return transaction
}

export function createMint(event: ethereum.Event, length: i32): _Mint {
    let id = event.transaction.hash.toHexString().concat('-').concat(BigInt.fromI32(length).toString())
    let mint = _Mint.load(id)
    if (!mint) {mint = new _Mint(id)}
    mint.save()

    return mint
}

export function createBurn(event: ethereum.Event, length: i32): _Burn {
    let id = event.transaction.hash.toHexString().concat('-').concat(BigInt.fromI32(length).toString())
    let burn = new _Burn(id)
    burn.save()

    return burn
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
// import { log } from '@graphprotocol/graph-ts'
import { Address, ethereum } from "@graphprotocol/graph-ts"
import { NetworkParameters } from "../../config/_paramConfig"
import { ERC20 } from "../../generated/Factory/ERC20"
import {
  DexAmmProtocol,
  LiquidityPool,
  _HelperStore,
  _TokenTracker,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  UsageMetricsDailySnapshot,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
  Token,
} from "../../generated/schema"
import { INT_ZERO, BIGDECIMAL_ZERO, ProtocolType, HelperStoreType, DEFAULT_DECIMALS, SECONDS_PER_DAY } from "./constants"


export function getOrCreateDex(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkParameters.FACTORY_ADDRESS)

  if (protocol === null) {
    protocol = new DexAmmProtocol(NetworkParameters.FACTORY_ADDRESS)
    protocol.name = "Uniswap v3"
    protocol.slug = "uniswap-v3"
    protocol.schemaVersion = "1.1.0"
    protocol.subgraphVersion = "1.0.1"
    protocol.methodologyVersion = "1.0.1"
    protocol.totalUniqueUsers = INT_ZERO
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
    protocol.totalVolumeUSD = BIGDECIMAL_ZERO
    protocol.network = NetworkParameters.NETWORK
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

export function getOrCreateToken(address: Address): Token {
    let id = address.toHexString();
    let token = Token.load(id);
    if (!token) {
      token = new Token(id);
      let erc20Contract = ERC20.bind(address);
      let decimals = erc20Contract.try_decimals();
      // Using try_cause some values might be missing
      let name = erc20Contract.try_name();
      let symbol = erc20Contract.try_symbol();
      // TODO: add overrides for name and symbol
      token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
      token.name = name.reverted ? '' : name.value;
      token.symbol = symbol.reverted ? '' : symbol.value;
      token.save();
    }
    return token as Token;
  }
  
  export function getOrCreateLPToken(tokenAddress: Address, token0: Token, token1: Token): Token {
    let id = tokenAddress.toHexString();
    let token = Token.load(id)
    // fetch info if null
    if (token === null) {
        token = new Token(tokenAddress.toHexString())
        token.symbol = token0.name + '/' + token1.name
        token.name = token0.name + '/' + token1.name + " LP"
        token.decimals = INT_ZERO
        token.save()
    }
    return token
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
        usageMetrics.protocol = NetworkParameters.FACTORY_ADDRESS;
  
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
        poolMetrics.protocol = NetworkParameters.FACTORY_ADDRESS;
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
        financialMetrics.protocol = NetworkParameters.FACTORY_ADDRESS;
  
        financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO

        financialMetrics.save()
    }
    return financialMetrics
}

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
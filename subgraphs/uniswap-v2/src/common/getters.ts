// import { log } from "@graphprotocol/graph-ts"
import { Address, ethereum } from "@graphprotocol/graph-ts"
import { ERC20 } from "../../generated/Factory/ERC20"
import {
  DexAmmProtocol,
  LiquidityPool,
  UsageMetricsDailySnapshot,
  PoolDailySnapshot,
  FinancialsDailySnapshot,
  _LiquidityPoolAmounts,
  _Transfer,
  _HelperStore,
  _TokenTracker,
  LiquidityPoolFee,
  Token
} from "../../generated/schema"
import { BIGDECIMAL_ZERO, HelperStoreType, Network, INT_ZERO, FACTORY_ADDRESS, ProtocolType, SECONDS_PER_DAY, BIGINT_ZERO, DEFAULT_DECIMALS} from "./constants"


export function getOrCreateDex(): DexAmmProtocol {
    let protocol = DexAmmProtocol.load(FACTORY_ADDRESS)
  
    if (!protocol) {
      protocol = new DexAmmProtocol(FACTORY_ADDRESS)
      protocol.name = "Uniswap v2"
      protocol.slug = "uniswap-v2"
      protocol.schemaVersion = "1.1.0"
      protocol.subgraphVersion = "1.0.2"
      protocol.methodologyVersion = "1.0.1"
      protocol.totalValueLockedUSD = BIGDECIMAL_ZERO
      protocol.totalVolumeUSD = BIGDECIMAL_ZERO
      protocol.totalUniqueUsers = INT_ZERO
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

export function getLiquidityPoolFee(id: string): LiquidityPoolFee {
    return LiquidityPoolFee.load(id)!
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

export function getOrCreateTransfer(event: ethereum.Event): _Transfer {
    let transactionHash = event.transaction.hash.toHexString()
    let transfer = _Transfer.load(transactionHash)
    if (!transfer) {    
        transfer = new _Transfer(transactionHash)
        transfer.blockNumber = event.block.number
        transfer.timestamp = event.block.timestamp
    }
    transfer.save()
    return transfer
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
  
        financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO

        financialMetrics.save()
    }
    return financialMetrics
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
        token.decimals = DEFAULT_DECIMALS
        token.save()
    }
    return token
  }

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
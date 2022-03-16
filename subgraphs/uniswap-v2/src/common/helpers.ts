import { BigInt, BigDecimal, Address, ethereum, log } from "@graphprotocol/graph-ts"

import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  DailyActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
  Token,
  PoolDailySnapshot
} from "../../generated/schema"
import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'
import { Pair as PoolContract } from '../../generated/templates/Pair/Pair'

import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY, BIGINT_ZERO, BIGINT_ONE, FACTORY_ADDRESS } from "../common/constants"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// token where amounts should contribute to tracked volume and liquidity
let USDstablecoins: string[]  = [
    '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI 
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
    '0x57ab1ec28d129707052df4df418d58a2d46d5f51' // sUSD
    ]


function token0PairPrice(pool: LiquidityPool): BigDecimal {
    return pool.inputTokenBalances[0].div(pool.inputTokenBalances[1])
}
function token1PairPrice(pool: LiquidityPool): BigDecimal {
    return pool.inputTokenBalances[1].div(pool.inputTokenBalances[0])
}

export function getPriceInUSD(token: Token): BigDecimal {
  if (token.id in USDstablecoins) {
    return BIGDECIMAL_ZERO
  }

  let DAIpoolAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(USDstablecoins[0]))
  let USDCpoolAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(USDstablecoins[1]))
  let USDTpoolAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(USDstablecoins[2]))

  // fetch eth prices for each stablecoin
  let daiPair = LiquidityPool.load(DAIpoolAddress.toHexString()) // dai is token0
  let usdcPair = LiquidityPool.load(USDCpoolAddress.toHexString()) // usdc is token0
  let usdtPair = LiquidityPool.load(USDTpoolAddress.toHexString()) // usdt is token1


  // all 3 have been created
  if (daiPair !== null && usdcPair !== null && usdtPair !== null) {
    let totalLiquidity = daiPair.inputTokenBalances[1].plus(usdcPair.inputTokenBalances[1]).plus(usdtPair.inputTokenBalances[0])
    let daiWeight = daiPair.inputTokenBalances[1].div(totalLiquidity)
    let usdcWeight = usdcPair.inputTokenBalances[1].div(totalLiquidity)
    let usdtWeight = usdtPair.inputTokenBalances[0].div(totalLiquidity)
   
    return token0PairPrice(daiPair)
      .times(daiWeight)
      .plus(token0PairPrice(usdcPair).times(usdcWeight))
      .plus(token1PairPrice(usdtPair).times(usdtWeight))
    // dai and USDC have been created
  } else if (daiPair !== null && usdcPair !== null) {
    let totalLiquidity = daiPair.inputTokenBalances[1].plus(usdcPair.inputTokenBalances[1])
    let daiWeight = daiPair.inputTokenBalances[1].div(totalLiquidity)
    let usdcWeight = usdcPair.inputTokenBalances[1].div(totalLiquidity)
    return token0PairPrice(daiPair).times(daiWeight).plus(token0PairPrice(usdcPair).times(usdcWeight))
    // USDC is the only pair so far
  } else if (usdcPair !== null) {
    return token0PairPrice(usdcPair)
  } else if (daiPair !== null) {
    return token0PairPrice(daiPair)
  } else {
    return BIGDECIMAL_ZERO
  }
}

export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  // Number of days since Unix epoch
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
    let financialMetrics = FinancialsDailySnapshot.load(id.toString());

    if (!financialMetrics) {
        financialMetrics = new FinancialsDailySnapshot(id.toString());
        financialMetrics.protocol = PROTOCOL_ID;

        financialMetrics.feesUSD = BIGDECIMAL_ZERO
        financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
        financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
        financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
        financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
    }

    let protocolTvlUsd = BIGDECIMAL_ZERO
    const protocol = DexAmmProtocol.load(PROTOCOL_ID)
    if (protocol) {
        if (!protocol.pools) {
        log.error(
            '[financials] no pool',
            []
        );
    }
        for (let i = 0; i < protocol.pools.length; i++) {
            const poolId = protocol.pools[i]
            const pool = LiquidityPool.load(poolId)
            protocolTvlUsd = protocolTvlUsd.plus(pool.totalValueLockedUSD)
        }
     financialMetrics.totalValueLockedUSD = protocolTvlUsd
    }
  
    // Update the block number and timestamp to that of the last transaction of that day
    financialMetrics.blockNumber = blockNumber;
    financialMetrics.timestamp = timestamp;

    financialMetrics.save();
}


export function updateUsageMetrics(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  // Number of days since Unix epoch
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = PROTOCOL_ID;

        usageMetrics.activeUsers = 0;
        usageMetrics.totalUniqueUsers = 0;
        usageMetrics.dailyTransactionCount = 0;
    }
  
    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = blockNumber;
    usageMetrics.timestamp = timestamp;
    usageMetrics.dailyTransactionCount += 1;

    let accountId = from.toHexString()
    let account = Account.load(accountId)
    if (!account) {
        account = new Account(accountId);
        account.save();
        usageMetrics.totalUniqueUsers += 1;
    } 

    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
    let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
    if (!dailyActiveAccount) {
        dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
        dailyActiveAccount.save();
        usageMetrics.activeUsers += 1;
    }

    usageMetrics.save();

}

export function updatePoolMetrics(blockNumber: BigInt, timestamp: BigInt, pool: LiquidityPool): void {
    // Number of days since Unix epoch
      let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
      let poolMetrics = PoolDailySnapshot.load(id.toString());
  
      if (!poolMetrics) {
        poolMetrics = new PoolDailySnapshot(id.toString());
        poolMetrics.protocol = PROTOCOL_ID;
        poolMetrics.pool = pool.id;
        poolMetrics.rewardTokenEmissionsAmount = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
        poolMetrics.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO]
      }
    
      // Update the block number and timestamp to that of the last transaction of that day
      poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
      poolMetrics.inputTokenBalances = pool.inputTokenBalances
      poolMetrics.outputTokenSupply = pool.outputTokenSupply
      poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD
      poolMetrics.blockNumber = blockNumber;
      poolMetrics.timestamp = timestamp;

      poolMetrics.save();
}

export function updateVolumeAndFees(timestamp: BigInt, trackedAmountUSD: BigDecimal, feeUSD: BigDecimal, pool: LiquidityPool): void {
  // Number of days since Unix epoch
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
    let poolMetrics = PoolDailySnapshot.load(id.toString());
    let financialMetrics = FinancialsDailySnapshot.load(id.toString());

    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(feeUSD)

    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)

    poolMetrics.save();
    financialMetrics.save()
    pool.save()

}


export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
    let bd = BigDecimal.fromString('1')
    for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
      bd = bd.times(BigDecimal.fromString('10'))
    }
    return bd
}
  
export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
    if (exchangeDecimals == BIGINT_ZERO) {
      return tokenAmount.toBigDecimal()
    }
    return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}
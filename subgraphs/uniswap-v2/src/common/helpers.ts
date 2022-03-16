import { BigInt, BigDecimal, Address, log } from "@graphprotocol/graph-ts"

import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  Account,
  DailyActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
  PoolDailySnapshot
} from "../../generated/schema"
import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'

import { BIGDECIMAL_ZERO, PROTOCOL_ID, SECONDS_PER_DAY, BIGINT_ZERO, BIGINT_ONE, FACTORY_ADDRESS } from "../common/constants"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ['0x9ea3b5b4ec044b70375236a281986106457b20ef']


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
            if (pool == null) return
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
    if (financialMetrics == null) return
    if (poolMetrics == null) return

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
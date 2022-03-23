import { BigInt, BigDecimal, Address, log } from "@graphprotocol/graph-ts"

import {
  UsageMetricsDailySnapshot,
  FinancialsDailySnapshot,
  _Account,
  _DailyActiveAccount,
  DexAmmProtocol,
  LiquidityPool,
  PoolDailySnapshot,
  _HelperStore
} from "../../generated/schema"
import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'

import { BIGDECIMAL_ZERO, INT_ZERO, INT_ONE, SECONDS_PER_DAY, BIGINT_ZERO, BIGINT_ONE, FACTORY_ADDRESS, BIGDECIMAL_ONE } from "../common/constants"

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ['0x9ea3b5b4ec044b70375236a281986106457b20ef']


export function updateFinancials(blockNumber: BigInt, timestamp: BigInt): void {
  // Number of days since Unix epoch
  let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
  let financialMetrics = FinancialsDailySnapshot.load(id.toString());
  let tvl = _HelperStore.load('TVL')
  if (tvl == null) return

  if (!financialMetrics) {
      financialMetrics = new FinancialsDailySnapshot(id.toString());
      financialMetrics.protocol = FACTORY_ADDRESS;

      financialMetrics.feesUSD = BIGDECIMAL_ZERO
      financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO
      financialMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO
      financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO
      financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO
  }
  
    // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = blockNumber;
  financialMetrics.timestamp = timestamp;
  financialMetrics.totalValueLockedUSD = tvl.valueDecimal!

  financialMetrics.save();
}



export function updateUsageMetrics(blockNumber: BigInt, timestamp: BigInt, from: Address): void {
  // Number of days since Unix epoch
    let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
    let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());
    let uniqueUsersTotal = _HelperStore.load("USERS")
    if (uniqueUsersTotal == null) return

    if (!usageMetrics) {
        usageMetrics = new UsageMetricsDailySnapshot(id.toString());
        usageMetrics.protocol = FACTORY_ADDRESS;

        usageMetrics.activeUsers = 0;
        usageMetrics.totalUniqueUsers = 0;
        usageMetrics.dailyTransactionCount = 0;
    }

    let accountId = from.toHexString()
    let account = _Account.load(accountId)
    if (!account) {
        account = new _Account(accountId);
        account.save();

        uniqueUsersTotal.valueInt = uniqueUsersTotal.valueInt + INT_ONE
    } 

    // Combine the id and the user address to generate a unique user id for the day
    let dailyActiveAccountId = id.toString() + "-" + from.toHexString()
    let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
    
    if (!dailyActiveAccount) {
        dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
        dailyActiveAccount.save();
        usageMetrics.activeUsers += 1;
    }

    // Update the block number and timestamp to that of the last transaction of that day
    usageMetrics.blockNumber = blockNumber;
    usageMetrics.timestamp = timestamp;
    usageMetrics.dailyTransactionCount += 1;
    usageMetrics.totalUniqueUsers = uniqueUsersTotal.valueInt

    usageMetrics.save();

}

export function updatePoolMetrics(blockNumber: BigInt, timestamp: BigInt, pool: LiquidityPool): void {
    // Number of days since Unix epoch
      let id: i64 = timestamp.toI64() / SECONDS_PER_DAY;
      let poolMetrics = PoolDailySnapshot.load(pool.id.concat("-").concat(id.toString()));
  
      if (!poolMetrics) {
        poolMetrics = new PoolDailySnapshot(pool.id.concat("-").concat(id.toString()));
        poolMetrics.protocol = FACTORY_ADDRESS;
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

    let poolMetrics = PoolDailySnapshot.load(pool.id.concat("-").concat(id.toString()));
    let financialMetrics = FinancialsDailySnapshot.load(id.toString());
    if (financialMetrics == null) return
    if (poolMetrics == null) return

    financialMetrics.totalVolumeUSD = financialMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    financialMetrics.feesUSD = financialMetrics.feesUSD.plus(feeUSD)
    financialMetrics.supplySideRevenueUSD = financialMetrics.supplySideRevenueUSD.plus(feeUSD)

    poolMetrics.totalVolumeUSD = poolMetrics.totalVolumeUSD.plus(trackedAmountUSD)
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD)

    poolMetrics.save();
    financialMetrics.save()
    pool.save()

}


export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = INT_ZERO; i < (decimals as i32); i = i + INT_ONE) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}
  
export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: i32): BigDecimal {
  if (exchangeDecimals == INT_ZERO) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
}


// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO
  } else {
    return amount0.div(amount1)
  }
}
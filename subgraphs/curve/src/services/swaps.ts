import { Address, BigDecimal, BigInt, Bytes, log, ethereum } from '@graphprotocol/graph-ts'
import { LiquidityPool, Swap } from '../../generated/schema'
import {
  getCryptoTokenSnapshot,
  getTokenSnapshotByAssetType,
  takePoolSnapshots,
} from './snapshots'
import {
  BIG_DECIMAL_TWO,
  BIG_INT_ONE,
  LENDING,
  STABLE_FACTORY
} from '../common/constants/index'
import { getBasePool, getVirtualBaseLendingPool } from './pools'
import { exponentToBigDecimal } from '../common/utils/numbers'
import { getOrCreateDexAmm, getOrCreateFinancialsDailySnapshot, getOrCreatePoolDailySnapshot, getOrCreatePoolHourlySnapshot, getOrCreateToken } from '../common/getters'
import { updateFinancials, updatePool, updatePoolMetrics, updateUsageMetrics } from '../common/metrics'

export function handleExchange(
  buyer: Address,
  sold_id: BigInt,
  bought_id: BigInt,
  tokens_sold: BigInt,
  tokens_bought: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
  address: Address,
  event: ethereum.Event,
  exchangeUnderlying: boolean
): void {
  const pool = LiquidityPool.load(address.toHexString())
  const txhash = event.transaction.hash.toHexString();
  if (!pool) {
    return
  }
  takePoolSnapshots(timestamp)
  const soldId = sold_id.toI32()
  const boughtId = bought_id.toI32()
  let tokenSold: String, tokenBought: String
  let tokenSoldDecimals: BigInt, tokenBoughtDecimals: BigInt
  let addTokenSoldAmt: bool = false, addTokenBoughtAmt: bool = false

  if (exchangeUnderlying && pool.poolType == LENDING) {
    const basePool = getVirtualBaseLendingPool(Address.fromString(pool.basePool))
    if (soldId > basePool.coins.length - 1) {
      log.error('Undefined underlying sold Id {} for lending pool {} at tx {}', [
        soldId.toString(),
        pool.id,
        txhash,
      ])
      return
    }
    tokenSold = basePool.coins[soldId]
    tokenSoldDecimals = basePool.coinDecimals[soldId]
  } else if (exchangeUnderlying && soldId != 0) {
    const underlyingSoldIndex = soldId - 1
    const basePool = getBasePool(Address.fromString(pool.basePool))
    if (underlyingSoldIndex > basePool.coins.length - 1) {
      log.error('Undefined underlying sold Id {} for pool {} at tx {}', [
        soldId.toString(),
        pool.id,
        txhash,
      ])
      return
    }
    tokenSold = basePool.coins[underlyingSoldIndex]
    if (((pool.assetType == 2 || pool.assetType == 0) && pool.poolType == STABLE_FACTORY) && (boughtId == 0)) {
      // handling an edge-case in the way the dx is logged in the event
      // for BTC metapools and for USD Metapool from factory v1.2
      tokenSoldDecimals = BigInt.fromI32(18)
    } else {
      tokenSoldDecimals = basePool.coinDecimals[underlyingSoldIndex]
    }
  } else {
    if (soldId > pool.inputTokens.length - 1) {
      log.error('Undefined sold Id {} for pool {} at tx {}', [soldId.toString(), pool.id, txhash])
      return
    }
    tokenSold = pool.inputTokens[soldId]
    tokenSoldDecimals = BigInt.fromI32(getOrCreateToken(Address.fromString(pool.inputTokens[soldId])).decimals)
    addTokenSoldAmt = true
  }

  if (exchangeUnderlying && pool.poolType == LENDING) {
    const basePool = getVirtualBaseLendingPool(Address.fromString(pool.basePool))
    if (boughtId > basePool.coins.length - 1) {
      log.error('Undefined underlying bought Id {} for lending pool {} at tx {}', [
        boughtId.toString(),
        pool.id,
        txhash,
      ])
      return
    }
    tokenBought = basePool.coins[boughtId]
    tokenBoughtDecimals = basePool.coinDecimals[boughtId]
  } else if (exchangeUnderlying && boughtId != 0) {
    const underlyingBoughtIndex = boughtId - 1
    const basePool = getBasePool(Address.fromString(pool.basePool))
    if (underlyingBoughtIndex > basePool.coins.length - 1) {
      log.error('Undefined underlying bought Id {} for pool {} at tx {}', [
        boughtId.toString(),
        pool.id,
        txhash,
      ])
    }
    tokenBought = basePool.coins[underlyingBoughtIndex]
    tokenBoughtDecimals = basePool.coinDecimals[underlyingBoughtIndex]
  } else {
    if (boughtId > pool.inputTokens.length - 1) {
      return
    }
    tokenBought = pool.inputTokens[boughtId]
    tokenBoughtDecimals = BigInt.fromI32(getOrCreateToken(Address.fromString(pool.inputTokens[boughtId])).decimals);
    addTokenBoughtAmt = true
  }

  const amountSold = tokens_sold.toBigDecimal().div(exponentToBigDecimal(tokenSoldDecimals.toI32()))
  const amountBought = tokens_bought.toBigDecimal().div(exponentToBigDecimal(tokenBoughtDecimals.toI32()))
  let amountBoughtUSD: BigDecimal, amountSoldUSD: BigDecimal
  if (!pool.isV2) {
    const latestPrice = getTokenSnapshotByAssetType(pool, blockNumber)
    amountBoughtUSD = amountBought.times(latestPrice)
    amountSoldUSD = amountSold.times(latestPrice)
  } else {
    const latestBoughtPriceUSD = getCryptoTokenSnapshot(Address.fromString(pool.inputTokens[boughtId]), blockNumber, pool)
    const latestSoldPriceUSD = getCryptoTokenSnapshot(Address.fromString(pool.inputTokens[soldId]), blockNumber, pool)
    amountBoughtUSD = amountBought.times(latestBoughtPriceUSD)
    amountSoldUSD = amountSold.times(latestSoldPriceUSD)
  }

  const swapEvent = new Swap(txhash + '-' + event.transactionLogIndex.toString())
  swapEvent.protocol = getOrCreateDexAmm().id
  swapEvent.pool = address.toHexString()
  swapEvent.timestamp = timestamp;
  swapEvent.amountIn = tokens_sold;
  swapEvent.amountOut = tokens_bought;
  swapEvent.amountInUSD = amountSoldUSD;
  swapEvent.amountOutUSD = amountBoughtUSD;
  swapEvent.tokenIn = tokenSold.toString();
  swapEvent.tokenOut = tokenBought.toString();
  swapEvent.from = buyer.toHexString();
  swapEvent.to = address.toHexString();
  swapEvent.hash = txhash;
  swapEvent.logIndex = event.transactionLogIndex.toI32();
  swapEvent.timestamp = timestamp
  swapEvent.blockNumber = blockNumber
  swapEvent.save()

  const volumeUSD = amountSoldUSD.plus(amountBoughtUSD).div(BIG_DECIMAL_TWO)

  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD)

  const hourlySnapshot = getOrCreatePoolHourlySnapshot(address.toHexString(),event);
  const dailySnapshot = getOrCreatePoolDailySnapshot(address.toHexString(),event);
  const financialSnapshot = getOrCreateFinancialsDailySnapshot(event);

  let hourlyVolumeByTokenAmount = hourlySnapshot.hourlyVolumeByTokenAmount
  let hourlyVolumeByTokenUSD = hourlySnapshot.hourlyVolumeByTokenUSD;
  let dailyVolumeByTokenAmount = dailySnapshot.dailyVolumeByTokenAmount;
  let dailyVolumeByTokenUSD = dailySnapshot.dailyVolumeByTokenUSD;
  const protocol = getOrCreateDexAmm();
  
  if (addTokenSoldAmt) {
    hourlyVolumeByTokenAmount[soldId] = hourlyVolumeByTokenAmount[soldId].plus(tokens_sold);
    dailyVolumeByTokenAmount[soldId] = dailyVolumeByTokenAmount[soldId].plus(tokens_sold);
    hourlyVolumeByTokenUSD[soldId] = hourlyVolumeByTokenUSD[soldId].plus(amountSoldUSD);
    dailyVolumeByTokenUSD[soldId] = dailyVolumeByTokenUSD[soldId].plus(amountSoldUSD);
  }
  if (addTokenBoughtAmt) {
    hourlyVolumeByTokenAmount[boughtId] = hourlyVolumeByTokenAmount[boughtId].plus(tokens_bought);
    dailyVolumeByTokenAmount[boughtId] = dailyVolumeByTokenAmount[boughtId].plus(tokens_bought);
    hourlyVolumeByTokenUSD[boughtId] = hourlyVolumeByTokenUSD[boughtId].plus(amountBoughtUSD);
    dailyVolumeByTokenUSD[boughtId] = dailyVolumeByTokenUSD[boughtId].plus(amountBoughtUSD);
  }

  hourlySnapshot.hourlyVolumeUSD = hourlySnapshot.hourlyVolumeUSD.plus(volumeUSD);
  hourlySnapshot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  hourlySnapshot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;

  dailySnapshot.dailyVolumeUSD = dailySnapshot.dailyVolumeUSD.plus(volumeUSD);
  dailySnapshot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  dailySnapshot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;

  financialSnapshot.dailyVolumeUSD = financialSnapshot.dailyVolumeUSD.plus(volumeUSD);

  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(volumeUSD);

  pool.save()
  hourlySnapshot.save()
  dailySnapshot.save()
  financialSnapshot.save()
  protocol.save()
  // update any metrics here
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event,'trade');
}

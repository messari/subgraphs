import { Address, BigDecimal, BigInt, Bytes, log, ethereum } from "@graphprotocol/graph-ts";
import { Swap } from "../../generated/schema";
import { getPoolAssetPrice, getTokenPriceSnapshot } from "./snapshots";
import { exponentToBigDecimal } from "../common/utils/numbers";
import {
  getOrCreateDexAmm,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePool,
  getOrCreatePoolDailySnapshot,
  getOrCreatePoolHourlySnapshot,
  getOrCreateToken,
} from "../common/getters";
import {
  updateFinancials,
  updatePool,
  updatePoolMetrics,
  updateProtocolRevenue,
  updateUsageMetrics,
} from "../common/metrics";
import { setPoolFeesV2 } from "../common/setters";
import { BIGDECIMAL_TWO, PoolType, ZERO_ADDRESS } from "../common/constants";

function handleExchangeUnderlying(i: i32, j: i32, coins: string[], underlyingCoins: string[]): string[] { // i = sold_id, j = bought_id
  const MAX_COIN = coins.length - 1;
  let base_i: i32 = 0, base_j: i32 = 0;
  let input_coin: string = ZERO_ADDRESS, output_coin: string = ZERO_ADDRESS;
  if (i == 0){
    input_coin = coins[0];
  } else {
    base_i = i - MAX_COIN
    input_coin = underlyingCoins[base_i]
  }
  if (j == 0){
        output_coin = coins[0];
  } else{
        base_j = j - MAX_COIN
        output_coin = underlyingCoins[base_j]
  }
  return [input_coin, output_coin]
}

function handleExchangeUnderlyingLending(i: i32, j: i32, underlyingCoins: string[]): string[] { // i = sold_id, j = bought_id
  let input_coin = underlyingCoins[i];
  let output_coin = underlyingCoins[j];
  return [input_coin, output_coin]
}


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
  exchangeUnderlying: boolean,
): void {
  const pool = getOrCreatePool(event.address, event);
  const txhash = event.transaction.hash.toHexString();
  if (!pool) {
    return;
  }
  const soldId = sold_id.toI32();
  const boughtId = bought_id.toI32();
  let tokenSold: String, tokenBought: String;
  let tokenSoldDecimals: BigInt, tokenBoughtDecimals: BigInt;
  let tokenList: string[] = [];

  if (exchangeUnderlying) {
    if (pool.underlyingTokens.length == 0) {
      log.error("handleExchangeUnderlying: no underlying coins for pool = {}, txhash = {}",[pool.id, txhash]);
    }
    tokenList = pool.poolType == PoolType.LENDING ? handleExchangeUnderlyingLending(soldId, boughtId, pool.underlyingTokens) : handleExchangeUnderlying(soldId, boughtId, pool.coins, pool.underlyingTokens);
  } else {
    tokenList = [pool.coins[soldId],pool.coins[boughtId]]
  }
  tokenSold = tokenList[0], tokenBought = tokenList[1];
  tokenSoldDecimals = BigInt.fromI32(getOrCreateToken(Address.fromString(tokenSold.toString())).decimals);
  tokenBoughtDecimals = BigInt.fromI32(getOrCreateToken(Address.fromString(tokenBought.toString())).decimals);

  const amountSold = tokens_sold.toBigDecimal().div(exponentToBigDecimal(tokenSoldDecimals.toI32()));
  const amountBought = tokens_bought.toBigDecimal().div(exponentToBigDecimal(tokenBoughtDecimals.toI32()));
  let amountBoughtUSD: BigDecimal, amountSoldUSD: BigDecimal;
  if (!pool.isV2) {
    const latestPrice = getPoolAssetPrice(pool, timestamp);
    amountBoughtUSD = amountBought.times(latestPrice);
    amountSoldUSD = amountSold.times(latestPrice);
  } else {
    const latestBoughtPriceUSD = getTokenPriceSnapshot(Address.fromString(pool.inputTokens[boughtId]), timestamp);
    const latestSoldPriceUSD = getTokenPriceSnapshot(Address.fromString(pool.inputTokens[boughtId]), timestamp);
    amountBoughtUSD = amountBought.times(latestBoughtPriceUSD);
    amountSoldUSD = amountSold.times(latestSoldPriceUSD);
  }

  const swapEvent = new Swap(txhash + "-" + event.transactionLogIndex.toString());
  swapEvent.protocol = getOrCreateDexAmm().id;
  swapEvent.pool = address.toHexString();
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
  swapEvent.timestamp = timestamp;
  swapEvent.blockNumber = blockNumber;
  swapEvent.save();

  const volumeUSD = amountSoldUSD.plus(amountBoughtUSD).div(BIGDECIMAL_TWO);

  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD);

  const hourlySnapshot = getOrCreatePoolHourlySnapshot(address.toHexString(), event);
  const dailySnapshot = getOrCreatePoolDailySnapshot(address.toHexString(), event);
  const financialSnapshot = getOrCreateFinancialsDailySnapshot(event);

  let hourlyVolumeByTokenAmount = hourlySnapshot.hourlyVolumeByTokenAmount;
  let hourlyVolumeByTokenUSD = hourlySnapshot.hourlyVolumeByTokenUSD;
  let dailyVolumeByTokenAmount = dailySnapshot.dailyVolumeByTokenAmount;
  let dailyVolumeByTokenUSD = dailySnapshot.dailyVolumeByTokenUSD;
  const protocol = getOrCreateDexAmm();

  if (pool.inputTokens.includes(tokenSold.toString())) {
    const tokenSoldIndex = pool.inputTokens.indexOf(tokenSold.toString());
    hourlyVolumeByTokenAmount[tokenSoldIndex] = hourlyVolumeByTokenAmount[tokenSoldIndex].plus(tokens_sold);
    dailyVolumeByTokenAmount[tokenSoldIndex] = dailyVolumeByTokenAmount[tokenSoldIndex].plus(tokens_sold);
    hourlyVolumeByTokenUSD[tokenSoldIndex] = hourlyVolumeByTokenUSD[tokenSoldIndex].plus(amountSoldUSD);
    dailyVolumeByTokenUSD[tokenSoldIndex] = dailyVolumeByTokenUSD[tokenSoldIndex].plus(amountSoldUSD);
  }
  if (pool.inputTokens.includes(tokenBought.toString())) {
    const tokenBoughtIndex = pool.inputTokens.indexOf(tokenBought.toString());
    hourlyVolumeByTokenAmount[tokenBoughtIndex] = hourlyVolumeByTokenAmount[tokenBoughtIndex].plus(tokens_bought);
    dailyVolumeByTokenAmount[tokenBoughtIndex] = dailyVolumeByTokenAmount[tokenBoughtIndex].plus(tokens_bought);
    hourlyVolumeByTokenUSD[tokenBoughtIndex] = hourlyVolumeByTokenUSD[tokenBoughtIndex].plus(amountBoughtUSD);
    dailyVolumeByTokenUSD[tokenBoughtIndex] = dailyVolumeByTokenUSD[tokenBoughtIndex].plus(amountBoughtUSD);
  }

  hourlySnapshot.hourlyVolumeUSD = hourlySnapshot.hourlyVolumeUSD.plus(volumeUSD);
  hourlySnapshot.hourlyVolumeByTokenAmount = hourlyVolumeByTokenAmount;
  hourlySnapshot.hourlyVolumeByTokenUSD = hourlyVolumeByTokenUSD;

  dailySnapshot.dailyVolumeUSD = dailySnapshot.dailyVolumeUSD.plus(volumeUSD);
  dailySnapshot.dailyVolumeByTokenAmount = dailyVolumeByTokenAmount;
  dailySnapshot.dailyVolumeByTokenUSD = dailyVolumeByTokenUSD;

  financialSnapshot.dailyVolumeUSD = financialSnapshot.dailyVolumeUSD.plus(volumeUSD);

  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(volumeUSD);

  pool.save();
  hourlySnapshot.save();
  dailySnapshot.save();
  financialSnapshot.save();
  protocol.save();
  // update any metrics here
  updatePool(pool, event); // also updates protocol tvl
  updatePoolMetrics(pool.id, event);
  updateProtocolRevenue(pool, volumeUSD, event);
  updateFinancials(event); // call after protocol tvl is updated
  updateUsageMetrics(event, "trade");
  if (pool.isV2) {
    setPoolFeesV2(pool);
  }
}

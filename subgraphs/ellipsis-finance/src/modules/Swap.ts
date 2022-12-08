import {
  Token,
  Swap as SwapTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  log,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  updateTokenVolume,
  updateProtocolRevenue,
  updateSnapshotsVolume,
} from "./Metrics";
import {
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import * as constants from "../common/constants";

export function createSwapTransaction(
  liquidityPool: LiquidityPoolStore,
  tokenIn: Token,
  amountIn: BigInt,
  amountInUSD: BigDecimal,
  tokenOut: Token,
  amountOut: BigInt,
  amountOutUSD: BigDecimal,
  buyer: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): SwapTransaction {
  const transactionId = "swap-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let swapTransaction = SwapTransaction.load(transactionId);

  if (!swapTransaction) {
    swapTransaction = new SwapTransaction(transactionId);

    swapTransaction.pool = liquidityPool.id;
    swapTransaction.protocol = getOrCreateDexAmmProtocol().id;

    swapTransaction.to = liquidityPool.id;
    swapTransaction.from = buyer.toHexString();

    swapTransaction.hash = transaction.hash.toHexString();
    swapTransaction.logIndex = transaction.index.toI32();

    swapTransaction.tokenIn = tokenIn.id;
    swapTransaction.amountIn = amountIn;
    swapTransaction.amountInUSD = amountInUSD;

    swapTransaction.tokenOut = tokenOut.id;
    swapTransaction.amountOut = amountOut;
    swapTransaction.amountOutUSD = amountOutUSD;

    swapTransaction.timestamp = block.timestamp;
    swapTransaction.blockNumber = block.number;

    swapTransaction.save();
  }

  return swapTransaction;
}

export function UpdateMetricsAfterSwap(block: ethereum.Block): void {
  const protocol = getOrCreateDexAmmProtocol();

  // Update hourly and daily deposit transaction count
  const metricsDailySnapshot = getOrCreateUsageMetricsDailySnapshot(block);
  const metricsHourlySnapshot = getOrCreateUsageMetricsHourlySnapshot(block);

  metricsDailySnapshot.dailySwapCount += 1;
  metricsHourlySnapshot.hourlySwapCount += 1;

  metricsDailySnapshot.save();
  metricsHourlySnapshot.save();

  protocol.save();
}

export function Swap(
  liquidityPoolAddress: Address,
  sold_id: BigInt,
  amountIn: BigInt,
  bought_id: BigInt,
  amountOut: BigInt,
  buyer: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  underlying: boolean = false
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let tokenIn: string;
  let tokenOut: string;

  if (!underlying) {
    tokenIn = pool.inputTokens[sold_id.toI32()];
    tokenOut = pool.inputTokens[bought_id.toI32()];
  } else {
    let underlyingCoins = utils.getPoolUnderlyingCoins(
      liquidityPoolAddress,
      pool._registry
        ? Address.fromString(pool._registry!)
        : constants.ADDRESS_ZERO
    );

    if (liquidityPoolAddress.equals(constants.EPS_POOL_ADDRESS))
      if (underlyingCoins.length == 0) underlyingCoins = pool.inputTokens;

    if (underlyingCoins.length == 0) return;

    tokenIn = underlyingCoins[sold_id.toI32()];
    tokenOut = underlyingCoins[bought_id.toI32()];
  }

  const tokenInStore = utils.getOrCreateTokenFromString(tokenIn, block);

  const amountInUSD = amountIn
    .divDecimal(
      constants.BIGINT_TEN.pow(tokenInStore.decimals as u8).toBigDecimal()
    )
    .times(tokenInStore.lastPriceUSD!);

  const tokenOutStore = utils.getOrCreateTokenFromString(tokenOut, block);
  const amountOutUSD = amountOut
    .divDecimal(
      constants.BIGINT_TEN.pow(tokenOutStore.decimals as u8).toBigDecimal()
    )
    .times(tokenOutStore.lastPriceUSD!);

  createSwapTransaction(
    pool,
    tokenInStore,
    amountIn,
    amountInUSD,
    tokenOutStore,
    amountOut,
    amountOutUSD,
    buyer,
    transaction,
    block
  );

  const volumeUSD = utils.calculateAverage([amountInUSD, amountOutUSD]);

  pool.inputTokenBalances = utils.getPoolBalances(
    liquidityPoolAddress,
    pool.inputTokens
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD,
    block
  );
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD);
  pool.save();

  updateTokenVolume(
    liquidityPoolAddress,
    tokenIn,
    amountIn,
    amountInUSD,
    block,
    underlying
  );
  updateTokenVolume(
    liquidityPoolAddress,
    tokenOut,
    amountOut,
    amountOutUSD,
    block,
    underlying
  );

  updateProtocolRevenue(liquidityPoolAddress, volumeUSD, block);
  updateSnapshotsVolume(liquidityPoolAddress, volumeUSD, block);
  UpdateMetricsAfterSwap(block);

  utils.updateProtocolTotalValueLockedUSD();

  log.info(
    "[Exchange] LiquidityPool: {}, tokenIn: {}, tokenOut: {}, amountInUSD: {}, amountOutUSD: {}, isUnderlying: {}, TxnHash: {}",
    [
      liquidityPoolAddress.toHexString(),
      tokenIn,
      tokenOut,
      amountInUSD.truncate(2).toString(),
      amountOutUSD.truncate(2).toString(),
      underlying.toString(),
      transaction.hash.toHexString(),
    ]
  );
}

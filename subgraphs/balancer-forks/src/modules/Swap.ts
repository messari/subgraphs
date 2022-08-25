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
  updateProtocolRevenue,
  updateSnapshotsVolume,
  updateTokenVolumeAndBalance,
} from "./Metrics";
import {
  getOrCreateToken,
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
  transaction: ethereum.Transaction,
  block: ethereum.Block
): SwapTransaction {
  let transactionId = "swap-"
    .concat(transaction.hash.toHexString())
    .concat("-")
    .concat(transaction.index.toString());

  let swapTransaction = SwapTransaction.load(transactionId);

  if (!swapTransaction) {
    swapTransaction = new SwapTransaction(transactionId);

    swapTransaction.pool = liquidityPool.id;
    swapTransaction.protocol = getOrCreateDexAmmProtocol().id;

    swapTransaction.to = liquidityPool.id;
    swapTransaction.from = transaction.from.toHexString();

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
  poolAddress: Address,
  tokenIn: Address,
  amountIn: BigInt,
  tokenOut: Address,
  amountOut: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
  const pool = getOrCreateLiquidityPool(poolAddress, block);

  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;

  let tokenInStore = getOrCreateToken(tokenIn, block.number);
  let tokenInIndex = pool.inputTokens.indexOf(tokenIn.toHexString());

  const amountInUSD = amountIn
    .divDecimal(
      constants.BIGINT_TEN.pow(tokenInStore.decimals as u8).toBigDecimal()
    )
    .times(tokenInStore.lastPriceUSD!);

  let tokenOutStore = getOrCreateToken(tokenOut, block.number);
  let tokenOutIndex = pool.inputTokens.indexOf(tokenOut.toHexString());

  const amountOutUSD = amountOut
    .divDecimal(
      constants.BIGINT_TEN.pow(tokenOutStore.decimals as u8).toBigDecimal()
    )
    .times(tokenOutStore.lastPriceUSD!);

  inputTokenBalances[tokenInIndex] =
    inputTokenBalances[tokenInIndex].plus(amountIn);
  inputTokenBalances[tokenOutIndex] =
    inputTokenBalances[tokenOutIndex].minus(amountOut);

  const volumeUSD = utils.calculateAverage([amountInUSD, amountOutUSD]);

  pool.inputTokenBalances = inputTokenBalances;
  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
    pool.inputTokenBalances,
    block
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(poolAddress);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD);
  pool.save();

  createSwapTransaction(
    pool,
    tokenInStore,
    amountIn,
    amountInUSD,
    tokenOutStore,
    amountOut,
    amountOutUSD,
    transaction,
    block
  );

  updateTokenVolumeAndBalance(
    poolAddress,
    tokenIn.toHexString(),
    amountIn,
    amountInUSD,
    block
  );
  updateTokenVolumeAndBalance(
    poolAddress,
    tokenOut.toHexString(),
    amountOut,
    amountOutUSD,
    block
  );

  updateProtocolRevenue(poolAddress, volumeUSD, block);
  updateSnapshotsVolume(poolAddress, volumeUSD, block);
  UpdateMetricsAfterSwap(block);

  utils.updateProtocolTotalValueLockedUSD();

  log.info(
    "[Exchange] LiquidityPool: {}, tokenIn: {}, tokenOut: {}, amountInUSD: {}, amountOutUSD: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      tokenIn.toHexString(),
      tokenOut.toHexString(),
      amountInUSD.truncate(2).toString(),
      amountOutUSD.truncate(2).toString(),
      transaction.hash.toHexString(),
    ]
  );
}

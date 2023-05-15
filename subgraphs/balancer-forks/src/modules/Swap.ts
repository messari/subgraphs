import {
  log,
  Bytes,
  BigInt,
  Address,
  ethereum,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Token,
  Swap as SwapTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
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
import { swapValueInUSD, updateTokenPrices } from "./Pricing";

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

  const tokenInStore = getOrCreateToken(tokenIn, block);
  const amountInUSD = amountIn
    .divDecimal(utils.exponentToBigDecimal(tokenInStore.decimals))
    .times(tokenInStore.lastPriceUSD!);

  const tokenOutStore = getOrCreateToken(tokenOut, block);
  const amountOutUSD = amountOut
    .divDecimal(utils.exponentToBigDecimal(tokenOutStore.decimals))
    .times(tokenOutStore.lastPriceUSD!);

  const volumeUSD = constants.USE_SWAP_BASED_PRICE_LIB
    ? swapValueInUSD(tokenIn, amountIn, tokenOut, amountOut, block)
    : utils.calculateAverage([amountInUSD, amountOutUSD]);

  updateTokenPrices(
    pool,
    tokenIn,
    amountIn,
    tokenOut,
    amountOut,
    volumeUSD,
    block
  );

  pool.inputTokenBalances = utils.getPoolInputTokenBalances(
    poolAddress,
    Bytes.fromHexString(pool._poolId)
  );
  pool.totalValueLockedUSD = utils.getPoolTVL(
    poolAddress,
    pool.inputTokens,
    pool.inputTokenBalances,
    block
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    poolAddress,
    pool.inputTokens
  );
  pool.outputTokenSupply = utils.getOutputTokenSupply(
    poolAddress,
    pool.outputTokenSupply!
  );
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(volumeUSD);
  pool.outputTokenPriceUSD = utils.getOutputTokenPriceUSD(poolAddress, block);
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

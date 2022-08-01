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
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
  getOrCreateUsageMetricsDailySnapshot,
  getOrCreateUsageMetricsHourlySnapshot,
} from "../common/initializers";
import * as utils from "../common/utils";
import { getUsdPricePerToken } from "../prices";
import { updateProtocolRevenue, updateSnapshotsVolume, updateTokenVolume } from "./Metrics";

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
    let underlyingCoins = utils.getPoolUnderlyingCoins(liquidityPoolAddress);

    if (underlyingCoins.length == 0) return;

    tokenIn = underlyingCoins[sold_id.toI32()].toHexString();
    tokenOut = underlyingCoins[bought_id.toI32()].toHexString();
  }

  let tokenInAddress = Address.fromString(tokenIn);
  let tokenInDecimals = utils.getTokenDecimals(tokenInAddress);
  let tokenInPrice = getUsdPricePerToken(tokenInAddress);

  const amountInUSD = amountIn
    .divDecimal(tokenInDecimals)
    .times(tokenInPrice.usdPrice)
    .div(tokenInPrice.decimalsBaseTen);

  let tokenOutAddress = Address.fromString(tokenOut);
  let tokenOutDecimals = utils.getTokenDecimals(tokenOutAddress);
  let tokenOutPrice = getUsdPricePerToken(tokenOutAddress);

  const amountOutUSD = amountOut
    .divDecimal(tokenOutDecimals)
    .times(tokenOutPrice.usdPrice)
    .div(tokenOutPrice.decimalsBaseTen);

  createSwapTransaction(
    pool,
    utils.getOrCreateTokenFromString(tokenIn),
    amountIn,
    amountInUSD,
    utils.getOrCreateTokenFromString(tokenOut),
    amountOut,
    amountOutUSD,
    buyer,
    transaction,
    block
  );

  const volumeUSD = utils.calculateAverage([amountInUSD, amountOutUSD]);

  pool.totalValueLockedUSD = utils.getPoolTVL(
    pool.inputTokens,
    pool.inputTokenBalances
  );
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
    pool.totalValueLockedUSD
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

  // TODO: Update Balances

  updateProtocolRevenue(liquidityPoolAddress, pool.cumulativeVolumeUSD, block);
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

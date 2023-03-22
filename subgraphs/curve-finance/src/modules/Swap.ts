import {
  Token,
  Swap as SwapTransaction,
  LiquidityPool as LiquidityPoolStore,
} from "../../generated/schema";
import {
  log,
  BigInt,
  crypto,
  Address,
  ethereum,
  ByteArray,
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

export function isTokenOutFromInputTokens(
  poolAddress: Address,
  amount: BigInt,
  event: ethereum.Event
): bool {
  const receipt = event.receipt;
  if (!receipt) return false;

  const eventLogs = event.receipt!.logs;
  if (!eventLogs) return false;

  for (let i = 0; i < eventLogs.length; i++) {
    const _log = eventLogs.at(i);
    if (_log.topics.length < 2) continue;

    const topic_signature = _log.topics.at(0);

    if (
      crypto
        .keccak256(ByteArray.fromUTF8("Transfer(address,address,uint256)"))
        .equals(topic_signature)
    ) {
      const fromAddress = ethereum.decode("address", _log.topics.at(1));
      const toAddress = ethereum.decode("address", _log.topics.at(2));

      if (!fromAddress || !toAddress) continue;

      if (
        fromAddress.toAddress().equals(constants.NULL.TYPE_ADDRESS) &&
        toAddress.toAddress().equals(poolAddress)
      ) {
        const transferAmount = ethereum.decode("uint256", _log.data);

        if (transferAmount && transferAmount.toBigInt().equals(amount))
          return true;
      }
    }
  }

  return false;
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
  soldId: BigInt,
  amountIn: BigInt,
  boughtId: BigInt,
  amountOut: BigInt,
  buyer: Address,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  event: ethereum.Event,
  underlying: boolean = false
): void {
  const pool = getOrCreateLiquidityPool(liquidityPoolAddress, block);

  let tokenIn: string;
  let tokenOut: string;

  if (!underlying) {
    tokenIn = pool._inputTokensOrdered[soldId.toI32()];
    tokenOut = pool._inputTokensOrdered[boughtId.toI32()];
  } else {
    const underlyingCoins = utils.getPoolUnderlyingCoinsFromRegistry(
      liquidityPoolAddress,
      Address.fromString(pool._registryAddress)
    );
    if (underlyingCoins.length == 0) return;

    tokenIn = underlyingCoins[soldId.toI32()].toHexString();
    tokenOut = underlyingCoins[boughtId.toI32()].toHexString();

    if (
      boughtId.toI32() == 0 &&
      isTokenOutFromInputTokens(liquidityPoolAddress, amountIn, event)
    )
      tokenIn = pool._inputTokensOrdered.at(-1);
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

  pool.inputTokenBalances = utils.getPoolBalances(pool);
  pool.inputTokenWeights = utils.getPoolTokenWeights(
    pool.inputTokens,
    pool.inputTokenBalances,
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

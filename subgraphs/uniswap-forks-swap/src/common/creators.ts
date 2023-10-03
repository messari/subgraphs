import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGDECIMAL_FIFTY_PERCENT,
  BIGINT_NEG_ONE,
  BIGINT_ZERO,
  EXPONENT_MIN,
  EXPONENT_MAX,
} from "./constants";
import {
  getLiquidityPool,
  getOrCreateProtocol,
  getOrCreateToken,
  getOrCreateLPToken,
} from "./getters";
import { convertTokenToDecimal } from "./utils";

import {
  LiquidityPool,
  Swap as SwapEvent,
  Token,
} from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";

// Create a liquidity pool from PairCreated event emission.
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  token0Address: string,
  token1Address: string
): void {
  const protocol = getOrCreateProtocol();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  if (
    token0.decimals < EXPONENT_MIN ||
    token0.decimals > EXPONENT_MAX ||
    token0.decimals < EXPONENT_MIN ||
    token1.decimals > EXPONENT_MAX
  ) {
    // If decimals for any of the input tokens are not in range [-6143, 6144]. Ignore it.
    // https://github.com/messari/subgraphs/issues/2375
    log.error(
      "Decimals for token(s) out of range - Ignore creating pair: token0: {} token1: {}",
      [token0.id, token1.id]
    );
    return;
  }

  const LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  const pool = new LiquidityPool(poolAddress);
  pool.protocol = protocol.id;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.fees = [];
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_FIFTY_PERCENT, BIGDECIMAL_FIFTY_PERCENT];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.save();

  // update number of pools
  protocol.totalPoolCount += 1;
  protocol.save();

  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  PairTemplate.create(Address.fromString(poolAddress));
}

// Handle swaps data and update entities volumes and fees
export function createSwap(
  event: ethereum.Event,
  to: string,
  sender: string,
  amount0In: BigInt,
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt
): void {
  if (amount0Out.gt(BIGINT_ZERO) && amount1Out.gt(BIGINT_ZERO)) {
    // If there are two output tokens with non-zero values, this is an invalid swap. Ignore it.
    log.error(
      "Two output tokens - Invalid Swap: amount0Out: {} amount1Out: {}",
      [amount0Out.toString(), amount1Out.toString()]
    );
    return;
  }

  const protocol = getOrCreateProtocol();
  const pool = getLiquidityPool(event.address.toHexString());

  const token0 = getOrCreateToken(pool.inputTokens[0]);
  const token1 = getOrCreateToken(pool.inputTokens[1]);

  // totals for volume updates
  const amount0 = amount0In.minus(amount0Out);
  const amount1 = amount1In.minus(amount1Out);

  token0._totalSupply = token0._totalSupply.plus(amount0);
  token1._totalSupply = token1._totalSupply.plus(amount1);

  token0._totalValueLockedUSD = BIGDECIMAL_ZERO;
  token1._totalValueLockedUSD = BIGDECIMAL_ZERO;

  token0.save();
  token1.save();

  // Gets the tokenIn and tokenOut payload based on the amounts
  const swapTokens = getSwapTokens(
    token0,
    token1,
    amount0In,
    amount0Out,
    amount1In,
    amount1Out
  );

  const logIndexI32 = event.logIndex.toI32();
  const transactionHash = event.transaction.hash.toHexString();
  const swap = new SwapEvent(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  // update swap event
  swap.hash = transactionHash;
  swap.logIndex = logIndexI32;
  swap.protocol = protocol.id;
  swap.to = to;
  swap.from = sender;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = swapTokens.tokenIn.id;
  swap.amountIn = swapTokens.amountIn;
  swap.amountInUSD = swapTokens.tokenInUSD;
  swap.tokenOut = swapTokens.tokenOut.id;
  swap.amountOut = swapTokens.amountOut;
  swap.amountOutUSD = swapTokens.tokenOutUSD;
  swap.reserveAmounts = [BIGINT_ZERO, BIGINT_ZERO];
  swap.pool = pool.id;

  swap.save();
}

class SwapTokens {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: BigInt;
  amountOut: BigInt;
  amountInConverted: BigDecimal;
  amountOutConverted: BigDecimal;
  tokenInUSD: BigDecimal;
  tokenOutUSD: BigDecimal;
}

// The purpose of this function is to identity input and output tokens for a swap event
function getSwapTokens(
  token0: Token,
  token1: Token,
  amount0In: BigInt,
  amount0Out: BigInt,
  amount1In: BigInt,
  amount1Out: BigInt
): SwapTokens {
  let tokenIn: Token;
  let tokenOut: Token;
  let amountIn: BigInt;
  let amountOut: BigInt;

  if (amount0Out.gt(BIGINT_ZERO)) {
    tokenIn = token1;
    tokenOut = token0;
    amountIn = amount1In.minus(amount1Out);
    amountOut = amount0In.minus(amount0Out).times(BIGINT_NEG_ONE);
  } else {
    tokenIn = token0;
    tokenOut = token1;
    amountIn = amount0In.minus(amount0Out);
    amountOut = amount1In.minus(amount1Out).times(BIGINT_NEG_ONE);
  }

  const amountInConverted = convertTokenToDecimal(amountIn, tokenIn.decimals);
  const amountOutConverted = convertTokenToDecimal(
    amountOut,
    tokenOut.decimals
  );

  const tokenInUSD = BIGDECIMAL_ZERO;
  const tokenOutUSD = BIGDECIMAL_ZERO;

  return {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    amountInConverted,
    amountOutConverted,
    tokenInUSD,
    tokenOutUSD,
  };
}

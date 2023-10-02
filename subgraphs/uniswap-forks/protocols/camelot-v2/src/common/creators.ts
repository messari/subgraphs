// import { log } from "@graphprotocol/graph-ts";
import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../../../configurations/configure";
import {
  LiquidityPool,
  LiquidityPoolFee,
  Swap as SwapEvent,
  Token,
  _HelperStore,
  _LiquidityPoolAmount,
} from "../../../../generated/schema";
import { Pair as PairTemplate } from "../../../../generated/templates";
import {
  BIGDECIMAL_FIFTY_PERCENT,
  BIGDECIMAL_ZERO,
  BIGINT_NEG_ONE,
  BIGINT_ZERO,
  INT_ZERO,
  LiquidityPoolFeeType,
} from "../../../../src/common/constants";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateLPToken,
  getOrCreateProtocol,
  getOrCreateToken,
} from "../../../../src/common/getters";
import { updateTokenWhitelists } from "../../../../src/common/updateMetrics";
import {
  convertTokenToDecimal,
  percToDec,
} from "../../../../src/common/utils/utils";
import { getTrackedVolumeUSD } from "../../../../src/price/price";
import { PROTOCOL_FEE_SHARE_ID, PairType } from "./constants";
import { updateVolumeAndFees } from "./updateMetrics";

function getOrCreateLiquidityPoolFee(id: string): LiquidityPoolFee {
  let fee = LiquidityPoolFee.load(id);
  if (!fee) {
    fee = new LiquidityPoolFee(id);
  }
  return fee;
}

// Create seperate fees for both tokens to handle directional fees
// If fee percent is not the same for both tokens, then fee types are set to dynamic and amounts to null
export function createPoolFees(
  poolAddress: string,
  token0TradingFee: BigDecimal | null = null,
  token1TradingFee: BigDecimal | null = null
): string[] {
  const poolLpFee = getOrCreateLiquidityPoolFee(poolAddress.concat("-lp-fee"));
  const poolLpFeeToken0 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-lp-fee-0")
  );
  const poolLpFeeToken1 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-lp-fee-1")
  );

  const poolProtocolFee = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-protocol-fee")
  );
  const poolProtocolFeeToken0 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-protocol-fee-0")
  );
  const poolProtocolFeeToken1 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-protocol-fee-1")
  );

  const poolTradingFee = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-trading-fee")
  );
  const poolTradingFeeToken0 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-trading-fee-0")
  );
  const poolTradingFeeToken1 = getOrCreateLiquidityPoolFee(
    poolAddress.concat("-trading-fee-1")
  );

  if (token0TradingFee && token1TradingFee) {
    if (token0TradingFee.notEqual(token1TradingFee)) {
      poolLpFee.feeType = LiquidityPoolFeeType.DYNAMIC_LP_FEE;
      poolLpFee.feePercentage = null;
      poolProtocolFee.feeType = LiquidityPoolFeeType.DYNAMIC_PROTOCOL_FEE;
      poolProtocolFee.feePercentage = null;
      poolTradingFee.feeType = LiquidityPoolFeeType.DYNAMIC_LP_FEE;
      poolTradingFee.feePercentage = null;
    } else {
      poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
      poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
      poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
      poolTradingFee.feePercentage = token0TradingFee;
    }
    poolLpFeeToken0.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
    poolProtocolFeeToken0.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    poolTradingFeeToken0.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
    poolTradingFeeToken0.feePercentage = token0TradingFee;

    poolLpFeeToken1.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
    poolProtocolFeeToken1.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    poolTradingFeeToken1.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
    poolTradingFeeToken1.feePercentage = token1TradingFee;
  }

  let protocolFeeShare = LiquidityPoolFee.load(PROTOCOL_FEE_SHARE_ID);
  if (!protocolFeeShare) {
    protocolFeeShare = new LiquidityPoolFee(PROTOCOL_FEE_SHARE_ID);
    protocolFeeShare.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
    protocolFeeShare.feePercentage = BIGDECIMAL_FIFTY_PERCENT;
    protocolFeeShare.save();
  }

  if (poolTradingFee.feePercentage) {
    poolProtocolFee.feePercentage = percToDec(
      protocolFeeShare.feePercentage!
    ).times(poolTradingFee.feePercentage!);
    poolLpFee.feePercentage = poolTradingFee.feePercentage!.minus(
      poolProtocolFee.feePercentage!
    );
  }

  poolProtocolFeeToken0.feePercentage = percToDec(
    protocolFeeShare.feePercentage!
  ).times(poolTradingFeeToken0.feePercentage!);
  poolLpFeeToken0.feePercentage = poolTradingFeeToken0.feePercentage!.minus(
    poolProtocolFeeToken0.feePercentage!
  );

  poolProtocolFeeToken1.feePercentage = percToDec(
    protocolFeeShare.feePercentage!
  ).times(poolTradingFeeToken1.feePercentage!);
  poolLpFeeToken1.feePercentage = poolTradingFeeToken1.feePercentage!.minus(
    poolProtocolFeeToken1.feePercentage!
  );

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  poolLpFeeToken0.save();
  poolProtocolFeeToken0.save();
  poolTradingFeeToken0.save();

  poolLpFeeToken1.save();
  poolProtocolFeeToken1.save();
  poolTradingFeeToken1.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Create a liquidity pool from PairCreated event emission.
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  token0Address: string,
  token1Address: string
): void {
  const protocol = getOrCreateProtocol();

  // create the tokens and tokentracker
  const token0 = getOrCreateToken(event, token0Address);
  const token1 = getOrCreateToken(event, token1Address);
  const LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  updateTokenWhitelists(token0, token1, poolAddress);

  const pool = new LiquidityPool(poolAddress);
  const poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.fees = createPoolFees(
    poolAddress,
    NetworkConfigs.getTradeFee(BIGINT_ZERO),
    NetworkConfigs.getTradeFee(BIGINT_ZERO)
  );
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
  pool.stakedOutputTokenAmount = BIGINT_ZERO;

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  const helperStore = new _HelperStore(poolAddress);
  // Used to track the number of deposits in a liquidity pool
  helperStore.valueInt = INT_ZERO;
  // Liquidity pool pair type
  helperStore.valueString = PairType.VOLATILE;

  // update number of pools
  protocol.totalPoolCount += 1;
  protocol.save();

  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  PairTemplate.create(Address.fromString(poolAddress));

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
  poolAmounts.save();
  helperStore.save();
}

// Handle swaps data and update entities volumes and fees
export function createSwapHandleVolumeAndFees(
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
  const poolAmounts = getLiquidityPoolAmounts(event.address.toHexString());

  const token0 = getOrCreateToken(event, pool.inputTokens[0]);
  const token1 = getOrCreateToken(event, pool.inputTokens[1]);

  // totals for volume updates
  const amount0 = amount0In.minus(amount0Out);
  const amount1 = amount1In.minus(amount1Out);

  token0._totalSupply = token0._totalSupply.plus(amount0);
  token1._totalSupply = token1._totalSupply.plus(amount1);

  token0._totalValueLockedUSD = convertTokenToDecimal(
    token0._totalSupply,
    token0.decimals
  ).times(token0.lastPriceUSD!);
  token1._totalValueLockedUSD = convertTokenToDecimal(
    token1._totalSupply,
    token1.decimals
  ).times(token1.lastPriceUSD!);

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

  const reserve0Amount = pool.inputTokenBalances[0];
  const reserve1Amount = pool.inputTokenBalances[1];

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
  swap.reserveAmounts = [reserve0Amount, reserve1Amount];
  swap.pool = pool.id;

  swap.save();

  // only accounts for volume through white listed tokens
  const trackedAmountUSD = getTrackedVolumeUSD(
    poolAmounts,
    swapTokens.amountInConverted,
    swapTokens.tokenIn,
    swapTokens.amountOutConverted,
    swapTokens.tokenOut
  );
  updateVolumeAndFees(
    event,
    protocol,
    pool,
    trackedAmountUSD,
    pool.inputTokens.indexOf(swapTokens.tokenIn.id),
    amount0.abs(),
    amount1.abs()
  );
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
export function getSwapTokens(
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

  const tokenInUSD = tokenIn.lastPriceUSD!.times(amountInConverted);
  const tokenOutUSD = tokenOut.lastPriceUSD!.times(amountOutConverted);

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

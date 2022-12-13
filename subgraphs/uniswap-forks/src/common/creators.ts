// import { log } from "@graphprotocol/graph-ts";
import {
  BigInt,
  Address,
  store,
  ethereum,
  log,
  BigDecimal,
} from "@graphprotocol/graph-ts";
import {
  Account,
  _HelperStore,
  _LiquidityPoolAmount,
  LiquidityPool,
  LiquidityPoolFee,
  Deposit,
  Withdraw,
  Swap as SwapEvent,
  Token,
} from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";
import {
  BIGDECIMAL_ZERO,
  INT_ZERO,
  INT_ONE,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  FeeSwitch,
  BIGDECIMAL_FIFTY_PERCENT,
  BIGINT_NEG_ONE,
} from "./constants";
import {
  getLiquidityPool,
  getOrCreateProtocol,
  getOrCreateTransfer,
  getOrCreateToken,
  getOrCreateLPToken,
  getLiquidityPoolAmounts,
} from "./getters";
import { convertTokenToDecimal, isSameSign } from "./utils/utils";
import {
  updateDepositHelper,
  updateTokenWhitelists,
  updateVolumeAndFees,
} from "./updateMetrics";
import { NetworkConfigs } from "../../configurations/configure";
import { getTrackedVolumeUSD } from "../price/price";

/**
 * Create the fee for a pool depending on the the protocol and network specific fee structure.
 * Specified in the typescript configuration file.
 */
export function createPoolFees(
  poolAddress: string,
  blockNumber: BigInt
): string[] {
  // get or create fee entities, set fee types
  let poolLpFee = LiquidityPoolFee.load(poolAddress.concat("-lp-fee"));
  if (!poolLpFee) {
    poolLpFee = new LiquidityPoolFee(poolAddress.concat("-lp-fee"));
    poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  }

  let poolProtocolFee = LiquidityPoolFee.load(
    poolAddress.concat("-protocol-fee")
  );
  if (!poolProtocolFee) {
    poolProtocolFee = new LiquidityPoolFee(poolAddress.concat("-protocol-fee"));
    poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  }

  let poolTradingFee = LiquidityPoolFee.load(
    poolAddress.concat("-trading-fee")
  );
  if (!poolTradingFee) {
    poolTradingFee = new LiquidityPoolFee(poolAddress.concat("-trading-fee"));
    poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  }

  // set fees
  if (NetworkConfigs.getFeeOnOff() == FeeSwitch.ON) {
    poolLpFee.feePercentage = NetworkConfigs.getLPFeeToOn(blockNumber);
    poolProtocolFee.feePercentage =
      NetworkConfigs.getProtocolFeeToOn(blockNumber);
  } else {
    poolLpFee.feePercentage = NetworkConfigs.getLPFeeToOff();
    poolProtocolFee.feePercentage = NetworkConfigs.getProtocolFeeToOff();
  }

  poolTradingFee.feePercentage = NetworkConfigs.getTradeFee(blockNumber);

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

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
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  const LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  updateTokenWhitelists(token0, token1, poolAddress);

  const pool = new LiquidityPool(poolAddress);
  const poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.fees = createPoolFees(poolAddress, event.block.number);
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

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  const poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

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
  poolDeposits.save();
}

// Create Account entity for participating account
export function createAndIncrementAccount(accountId: string): i32 {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.save();

    return INT_ONE;
  }
  return INT_ZERO;
}

// Create a Deposit entity and update deposit count on a Mint event for the specific pool..
export function createDeposit(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt
): void {
  const transfer = getOrCreateTransfer(event);

  const pool = getLiquidityPool(
    event.address.toHexString(),
    event.block.number
  );

  const token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  // update exchange info (except balances, sync will cover that)
  const token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  const token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  const logIndexI32 = event.logIndex.toI32();
  const transactionHash = event.transaction.hash.toHexString();
  const deposit = new Deposit(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  deposit.hash = transactionHash;
  deposit.logIndex = logIndexI32;
  deposit.protocol = NetworkConfigs.getFactoryAddress();
  deposit.to = pool.id;
  deposit.from = transfer.sender!;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[INT_ZERO], pool.inputTokens[INT_ONE]];
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.outputTokenAmount = transfer.liquidity;
  deposit.amountUSD = token0
    .lastPriceUSD!.times(token0Amount)
    .plus(token1.lastPriceUSD!.times(token1Amount));
  deposit.pool = pool.id;

  updateDepositHelper(event.address);

  deposit.save();
}

// Create a Withdraw entity on a Burn event for the specific pool..
export function createWithdraw(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt
): void {
  const transfer = getOrCreateTransfer(event);

  const pool = getLiquidityPool(
    event.address.toHexString(),
    event.block.number
  );

  const token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  // update exchange info (except balances, sync will cover that)
  const token0Amount = convertTokenToDecimal(amount0, token0.decimals);
  const token1Amount = convertTokenToDecimal(amount1, token1.decimals);

  const logIndexI32 = event.logIndex.toI32();
  const transactionHash = event.transaction.hash.toHexString();
  const withdrawal = new Withdraw(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  withdrawal.hash = transactionHash;
  withdrawal.logIndex = logIndexI32;
  withdrawal.protocol = NetworkConfigs.getFactoryAddress();
  withdrawal.to = transfer.sender!;
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [
    pool.inputTokens[INT_ZERO],
    pool.inputTokens[INT_ONE],
  ];
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.outputTokenAmount = transfer.liquidity;
  withdrawal.amountUSD = token0
    .lastPriceUSD!.times(token0Amount)
    .plus(token1.lastPriceUSD!.times(token1Amount));
  withdrawal.pool = pool.id;

  store.remove("_Transfer", transfer.id);

  withdrawal.save();
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
  const pool = getLiquidityPool(
    event.address.toHexString(),
    event.block.number
  );
  const poolAmounts = getLiquidityPoolAmounts(event.address.toHexString());

  const token0 = getOrCreateToken(pool.inputTokens[0]);
  const token1 = getOrCreateToken(pool.inputTokens[1]);

  // totals for volume updates
  const amount0 = amount0In.minus(amount0Out);
  const amount1 = amount1In.minus(amount1Out);

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

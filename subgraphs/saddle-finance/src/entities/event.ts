import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Deposit,
  LiquidityPool,
  Swap as SwapEvent,
  Token,
  Withdraw,
} from "../../generated/schema";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getTokenAmountsSumUSD, getPriceUSD } from "../utils/price";
import {
  handlePoolSwap,
  getOrCreatePool,
  handlePoolDeposit,
  handlePoolWithdraw,
} from "./pool";
import { getOrCreateProtocol, updateUsageMetrics } from "./protocol";

export function createDeposit(
  event: ethereum.Event,
  inputTokenAmounts: BigInt[],
  totalOutputTokenAmount: BigInt,
  provider: Address
): void {
  const pool = getOrCreatePool(event.address);
  const deposit = new Deposit(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  deposit.pool = pool.id;
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateProtocol().id;
  deposit.to = pool.id;
  deposit.from = provider.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = pool.inputTokens;
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = getInputTokenAmounts(inputTokenAmounts, pool);
  deposit.outputTokenAmount = totalOutputTokenAmount.minus(
    pool.outputTokenSupply!
  );
  deposit.amountUSD = getTokenAmountsSumUSD(
    event,
    deposit.inputTokenAmounts,
    pool.inputTokens
  );
  deposit.save();
  handlePoolDeposit(event, pool, deposit);
  updateUsageMetrics(event, provider);
}

export function createWithdraw(
  event: ethereum.Event,
  inputTokenAmounts: BigInt[],
  totalOutputTokenAmount: BigInt,
  provider: Address
): void {
  const pool = getOrCreatePool(event.address);
  const withdraw = new Withdraw(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  withdraw.pool = pool.id;
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateProtocol().id;
  withdraw.to = pool.id;
  withdraw.from = provider.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokens = pool.inputTokens;
  withdraw.outputToken = pool.outputToken;
  withdraw.inputTokenAmounts = getInputTokenAmounts(inputTokenAmounts, pool);
  withdraw.outputTokenAmount = pool.outputTokenSupply!.minus(
    totalOutputTokenAmount
  );
  withdraw.amountUSD = getTokenAmountsSumUSD(
    event,
    withdraw.inputTokenAmounts,
    pool.inputTokens
  );
  withdraw.save();
  handlePoolWithdraw(event, pool, withdraw);
  updateUsageMetrics(event, provider);
}

export function createSwap(
  pool: LiquidityPool,
  event: ethereum.Event,
  tokenIn: Token,
  amountIn: BigInt,
  tokenOut: Token,
  amountOut: BigInt,
  buyer: Address
): void {
  const swap = new SwapEvent(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  swap.pool = pool.id;
  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = getOrCreateProtocol().id;
  swap.to = buyer.toHexString();
  swap.from = buyer.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = tokenIn.id;
  swap.amountIn = amountIn;
  swap.amountInUSD = bigIntToBigDecimal(amountIn, tokenIn.decimals).times(
    getPriceUSD(tokenIn, event)
  );
  swap.tokenOut = tokenOut.id;
  swap.amountOut = amountOut;
  swap.amountOutUSD = bigIntToBigDecimal(amountOut, tokenOut.decimals).times(
    getPriceUSD(tokenOut, event)
  );
  swap.save();
  handlePoolSwap(event, pool, swap);
  updateUsageMetrics(event, buyer);
}

function getInputTokenAmounts(
  tokenAmounts: BigInt[],
  pool: LiquidityPool
): BigInt[] {
  if (!pool._basePool) {
    return tokenAmounts;
  }
  const lpTokenBalance = tokenAmounts.pop();
  const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
  const totalLPTokenSupply = basePool.outputTokenSupply!;
  // Calculate input token amounts based on LP token ratio
  for (let i = 0; i < basePool.inputTokenBalances.length; i++) {
    const balance = basePool.inputTokenBalances[i];
    tokenAmounts.push(balance.times(lpTokenBalance).div(totalLPTokenSupply));
  }
  return tokenAmounts;
}

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
import { sortValuesByTokenOrder } from "./pool";

export function createDeposit(
  event: ethereum.Event,
  inputTokenAmounts: BigInt[], // these come sorted as in the contract, which might not match pool.inputTokens positions.
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
  inputTokenAmounts: BigInt[], // these come sorted as in the contract, which might not match pool.inputTokens positions.
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
  withdraw.to = provider.toHexString();
  withdraw.from = pool.id;
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

// getInputTokenAmounts will return the token balances of each pool.inputTokens
// sorted to match the order of inputTokens. It expects the param tokenAmounts to be
// sorted as they are in the contract (which might differ from pool.inputTokens).
// If the pool is a meta pool, the base token will be replaced with the underlying amounts.
// To be able to sort those properly, since they are already sorted inside pool._basePool.inputTokens
// we need to sort them as in the contract to then sort them again together with the pool tokens.
// Attempting to explain in a more visual way, given a pool:
// pool [tokenA, tokenB, baseToken(tokenC, tokenD)]
// When decomposing the baseToken and sorting the tokens on our entity
// it might end up being:
// pool[tokenC, tokenA, tokenD, tokenB]
// So we have to make sure that we move the tokenAmounts in the same way token IDs move.
function getInputTokenAmounts(
  tokenAmounts: BigInt[],
  pool: LiquidityPool
): BigInt[] {
  if (!pool._basePool) {
    return sortValuesByTokenOrder(pool._inputTokensOrdered, pool.inputTokens, tokenAmounts);
  }
  const lpTokenBalance = tokenAmounts.pop();
  const basePool = getOrCreatePool(Address.fromString(pool._basePool!));
  const totalLPTokenSupply = basePool.outputTokenSupply!;
  // Calculate input token amounts based on LP token ratio
  let bpTokenAmounts = new Array<BigInt>();
  for (let i = 0; i < basePool.inputTokenBalances.length; i++) {
    const balance = basePool.inputTokenBalances[i];
    bpTokenAmounts.push(balance.times(lpTokenBalance).div(totalLPTokenSupply));
  }

  // sort BP token amounts as in the contract
  bpTokenAmounts = sortValuesByTokenOrder(basePool.inputTokens, basePool._inputTokensOrdered, bpTokenAmounts);

  // sort all token amounts together.
  return sortValuesByTokenOrder(
    pool._inputTokensOrdered,
    pool.inputTokens,
    tokenAmounts.concat(bpTokenAmounts),
  );
}

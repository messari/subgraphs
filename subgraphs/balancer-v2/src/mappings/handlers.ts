import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PoolBalanceChanged, PoolRegistered, TokensRegistered, Swap } from "../../generated/Vault/Vault";
import { createPool, getOrCreateToken, getOrCreateSwap } from "../common/getters";
import { LiquidityPool } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";
import { updateFinancials, updatePoolMetrics, updateTokenPrice, updateUsageMetrics } from "../common/metrics";
import { isUSDStable, valueInUSD } from "../common/pricing";
import { scaleDown } from "../common/tokens";
import { ERC20 } from "../../generated/Vault/ERC20";

export function handlePoolRegister(event: PoolRegistered): void {
  createPool(event.params.poolId.toHexString(), event.params.poolAddress, event.block);
}

export function handleTokensRegister(event: TokensRegistered): void {
  let tokens: string[] = [];
  let tokensAmount: BigInt[] = [];
  for (let i = 0; i < event.params.tokens.length; i++) {
    let token = getOrCreateToken(event.params.tokens[i]);
    tokens.push(token.id);
    tokensAmount.push(BIGINT_ZERO);
  }
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) {
    return;
  }
  pool.inputTokens = tokens;
  pool.inputTokenBalances = tokensAmount;
  pool.save();
}

export function handlePoolBalanceChanged(event: PoolBalanceChanged): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) return;
  let amounts: BigInt[] = [];

  for (let i = 0; i < event.params.deltas.length; i++) {
    let currentAmount = pool.inputTokenBalances[i];
    amounts.push(currentAmount.plus(event.params.deltas[i]));
  }

  const outputToken = ERC20.bind(Address.fromString(pool.outputToken));
  const totalSupplyCall = outputToken.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    pool.outputTokenSupply = totalSupplyCall.value;
  }
  pool.inputTokenBalances = amounts;
  pool.save();

  updatePoolMetrics(event, pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) return;

  const tokenIn = event.params.tokenIn;
  const tokenOut = event.params.tokenOut;

  let tokenInIndex: i32 = 0;
  let tokenOutIndex: i32 = 0;
  let newBalances = pool.inputTokenBalances;

  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    if (tokenIn == Address.fromString(pool.inputTokens[i])) {
      newBalances[i] = pool.inputTokenBalances[i].plus(event.params.amountIn);
      tokenInIndex = i;
    }

    if (tokenOut == Address.fromString(pool.inputTokens[i])) {
      newBalances[i] = pool.inputTokenBalances[i].minus(event.params.amountOut);
      tokenOutIndex = i;
    }
  }

  pool.inputTokenBalances = newBalances;
  pool.save();

  updateTokenPrice(
    pool,
    tokenIn,
    event.params.amountIn,
    tokenInIndex,
    tokenOut,
    event.params.amountOut,
    tokenOutIndex,
    event.block.number,
  );

  const swap = getOrCreateSwap(event, pool);
  const amountIn = scaleDown(event.params.amountIn, tokenIn);
  const amountOut = scaleDown(event.params.amountOut, tokenOut);

  swap.tokenIn = tokenIn.toHexString();
  swap.tokenOut = tokenOut.toHexString();
  swap.amountIn = event.params.amountIn;
  swap.amountOut = event.params.amountOut;
  swap.amountInUSD = isUSDStable(tokenIn) ? amountIn : valueInUSD(amountIn, tokenIn);
  swap.amountOutUSD = isUSDStable(tokenOut) ? amountOut : valueInUSD(amountOut, tokenOut);
  swap.save();

  updatePoolMetrics(event, pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

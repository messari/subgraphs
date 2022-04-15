import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { PoolBalanceChanged, PoolRegistered, Swap, TokensRegistered } from "../../generated/Vault/Vault";
import { createPool, getOrCreateToken } from "../common/getters";
import { LiquidityPool } from "../../generated/schema";
import { BIGINT_ZERO } from "../common/constants";
import {updateFinancials, updatePoolMetrics, updateTokenPrice, updateUsageMetrics} from "../common/metrics";

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
  pool.inputTokenBalances = amounts;
  pool.save();

  updatePoolMetrics(pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) return;

  let tokenInIndex: i32 = 0;
  let tokenOutIndex: i32 = 0;

  let newBalances = pool.inputTokenBalances;

  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    if (event.params.tokenIn.equals(Bytes.fromHexString(pool.inputTokens[i]))) {
      newBalances[i] = pool.inputTokenBalances[i].plus(event.params.amountIn);
      tokenInIndex = i;
    }

    if (event.params.tokenOut.equals(Bytes.fromHexString(pool.inputTokens[i]))) {
      newBalances[i] = pool.inputTokenBalances[i].minus(event.params.amountOut);
      tokenOutIndex = i;
    }
  }

  pool.inputTokenBalances = newBalances;
  pool.save();

  updateTokenPrice(
      pool,
      event.params.tokenIn,
      event.params.amountIn,
      tokenInIndex,
      event.params.tokenOut,
      event.params.amountOut,
      tokenOutIndex,
      event.block.number
  )

  updatePoolMetrics(pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

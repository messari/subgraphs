import {PoolBalanceChanged, PoolRegistered, Swap, TokensRegistered} from "../../generated/Vault/Vault";
import {createPool, getOrCreateToken} from "../common/getters";
import {LiquidityPool} from "../../generated/schema";
import {BigInt} from "@graphprotocol/graph-ts";
import {BIGINT_ZERO} from "../common/constants";
import {updateFinancials, updateUsageMetrics} from "../common/metrics";

export function handlePoolRegister(event: PoolRegistered): void {
  createPool(event.params.poolId.toHexString(), event.params.poolAddress, event.block)
}

export function handleTokensRegister(event: TokensRegistered): void {
  let tokens: string[] = []
  let tokensAmount: BigInt[] = []
  for (let i=0; i<event.params.tokens.length; i++) {
     let token = getOrCreateToken(event.params.tokens[i])
     tokens.push(token.id)
     tokensAmount.push(BIGINT_ZERO)
  }
  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) {
    return
  }
  pool.inputTokens = tokens
  pool.inputTokenBalances = tokensAmount
  pool.save()
}

export function handlePoolBalanceChanged(event: PoolBalanceChanged): void {
  updateFinancials(event)
  updateUsageMetrics(event, event.transaction.from)

  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) return
  let amounts: BigInt[] = []
  for (let i=0; i<event.params.deltas.length; i++) {
    let currentAmount = pool.inputTokenBalances[i]
    amounts.push(currentAmount.plus(event.params.deltas[i]))
  }
  pool.inputTokenBalances = amounts;
  pool.save()
}

export function handleSwap(event: Swap): void {
  updateFinancials(event)
  updateUsageMetrics(event, event.transaction.from)

  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) return

  let tokenInIndex: u32 = -1;
  let tokenOutIndex: u32 = -1;

  for (let i=0; i<pool.inputTokens.length; i++) {
    if (event.params.tokenIn.toHexString() === pool.inputTokens[i]) {
      tokenInIndex = i
    }

    if (event.params.tokenIn.toHexString() === pool.inputTokens[i]) {
      tokenOutIndex = i
    }
  }

  if (tokenInIndex < 0) return
  if (tokenOutIndex < 0) return

  pool.inputTokenBalances[tokenInIndex] = pool.inputTokenBalances[tokenInIndex].plus(event.params.amountIn)
  pool.inputTokenBalances[tokenOutIndex] = pool.inputTokenBalances[tokenOutIndex].minus(event.params.amountIn)

  pool.save()
}
import {PoolBalanceChanged, PoolRegistered, Swap, TokensRegistered} from "../../generated/Vault/Vault";
import {createPool, getOrCreateToken} from "../common/getters";
import {LiquidityPool, _TokenPrice} from "../../generated/schema";
import {Address, BigDecimal, BigInt} from "@graphprotocol/graph-ts";
import {BIGINT_ZERO} from "../common/constants";
import {updateFinancials, updatePoolMetrics, updateUsageMetrics} from "../common/metrics";
import {WeightedPool} from "../../generated/Vault/WeightedPool";
import {calculateTokenValueInUsd, isUSDStable} from "../common/pricing";

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
  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) return
  let amounts: BigInt[] = []
  for (let i=0; i<event.params.deltas.length; i++) {
    let currentAmount = pool.inputTokenBalances[i]
    amounts.push(currentAmount.plus(event.params.deltas[i]))
  }
  pool.inputTokenBalances = amounts;
  pool.save()

  updatePoolMetrics(event.params.poolId.toHexString())
  updateUsageMetrics(event, event.transaction.from)
  updateFinancials(event)
}

export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString())
  if (pool == null) return

  let tokenInIndex: u32 = 0
  let tokenOutIndex: u32 = 0

  for (let i=0; i<pool.inputTokens.length; i++) {
    if (event.params.tokenIn.toHexString() === pool.inputTokens[i]) {
      pool.inputTokenBalances[i] = pool.inputTokenBalances[i].plus(event.params.amountIn)
      tokenInIndex = i
    }

    if (event.params.tokenOut.toHexString() === pool.inputTokens[i]) {
      pool.inputTokenBalances[i] = pool.inputTokenBalances[i].minus(event.params.amountOut)
      tokenOutIndex = i
    }
  }

  let weightPool = WeightedPool.bind(Address.fromString(pool.outputToken))
  let getWeightCall = weightPool.try_getNormalizedWeights()
  let hasWeights = !getWeightCall.reverted
  let price: BigDecimal;

  if (isUSDStable(event.params.tokenIn)) {
    if (hasWeights) {
      price = calculateTokenValueInUsd(
          event.params.amountOut,
          event.params.amountIn,
          getWeightCall.value[tokenOutIndex],
          getWeightCall.value[tokenInIndex]
      )
    } else {
      price = calculateTokenValueInUsd(
          event.params.amountOut,
          event.params.amountIn,
          null,
          null
      )
    }
    let token = _TokenPrice.load(event.params.tokenOut.toHexString())
    if (token == null) {
      token = new _TokenPrice(event.params.tokenOut.toHexString())
    }
    token.block = event.block.number
    token.lastUsdPrice = price;
  }

  if (isUSDStable(event.params.tokenOut)) {
    if (hasWeights) {
      price = calculateTokenValueInUsd(
          event.params.amountIn,
          event.params.amountOut,
          getWeightCall.value[tokenInIndex],
          getWeightCall.value[tokenOutIndex]
      )
    } else {
      price = calculateTokenValueInUsd(
          event.params.amountIn,
          event.params.amountOut,
          null,
          null
      )
    }
    let token = _TokenPrice.load(event.params.tokenIn.toHexString())
    if (token == null) {
      token = new _TokenPrice(event.params.tokenIn.toHexString())
    }
    token.block = event.block.number
    token.lastUsdPrice = price;
  }

  updatePoolMetrics(event.params.poolId.toHexString())
  updateUsageMetrics(event, event.transaction.from)
  updateFinancials(event)
}
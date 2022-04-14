import { PoolBalanceChanged, PoolRegistered, Swap, TokensRegistered } from "../../generated/Vault/Vault";
import { createPool, getOrCreateToken } from "../common/getters";
import { LiquidityPool, _TokenPrice } from "../../generated/schema";
import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { BIGINT_ZERO } from "../common/constants";
import { updateFinancials, updatePoolMetrics, updateUsageMetrics } from "../common/metrics";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { calculatePrice } from "../common/pricing";
import { scaleDown } from "../common/tokens";
import { log } from "matchstick-as"
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
  log.info(pool.inputTokenBalances.toString(), [])
  log.info(pool.inputTokens.toString(), [])
  for (let i = 0; i < event.params.deltas.length; i++) {
    let currentAmount = pool.inputTokenBalances[i];
    amounts.push(currentAmount.plus(event.params.deltas[i]));
  }
  pool.inputTokenBalances = amounts;
  pool.save();

  log.info("////////////////", [])
  log.info(pool.inputTokens.toString(), [])
  log.info(pool.inputTokenBalances.toString(), [])
  log.info("////////////////", [])
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
  log.info("ininininininin", [])
  log.info(pool.inputTokenBalances[i].toString(), [])
  log.info(event.params.amountIn.toString(), [])
  log.info("ininininininin", [])
      newBalances[i] = pool.inputTokenBalances[i].plus(event.params.amountIn);
      tokenInIndex = i;
    }

    if (event.params.tokenOut.equals(Bytes.fromHexString(pool.inputTokens[i]))) {
      log.info("outoutoutoutout", [])
  log.info(pool.inputTokenBalances[i].toString(), [])
  log.info(event.params.amountOut.toString(), [])
  log.info("outoutoutoutout", [])
      newBalances[i] = pool.inputTokenBalances[i].minus(event.params.amountOut);
      tokenOutIndex = i;
    }
  }

  pool.inputTokenBalances = newBalances;
  pool.save();

  log.info("////////////////", [])
  log.info(pool.inputTokens.toString(), [])
  log.info(pool.inputTokenBalances.toString(), [])
  log.info("////////////////", [])

  let weightPool = WeightedPool.bind(Address.fromString(pool.outputToken));
  let getWeightCall = weightPool.try_getNormalizedWeights();
  let hasWeights = !getWeightCall.reverted;
  let weightTokenOut: BigDecimal | null = null;
  let weightTokenIn: BigDecimal | null = null;

  if (hasWeights) {
    weightTokenOut = scaleDown(getWeightCall.value[tokenOutIndex], null);
    weightTokenIn = scaleDown(getWeightCall.value[tokenInIndex], null);
  }

  let tokenAmountIn = scaleDown(event.params.amountIn, event.params.tokenIn);
  let tokenAmountOut = scaleDown(event.params.amountOut, event.params.tokenOut);

  const tokenInfo = calculatePrice(
    event.params.tokenIn,
    tokenAmountIn,
    weightTokenIn,
    event.params.tokenOut,
    tokenAmountOut,
    weightTokenOut,
  );

  if (tokenInfo) {
    let token = _TokenPrice.load(tokenInfo.address.toHexString());
    if (token == null) {
      token = new _TokenPrice(tokenInfo.address.toHexString());
    }
    token.block = event.block.number;
    token.lastUsdPrice = tokenInfo.price;
    token.save();
  }

  updatePoolMetrics(pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

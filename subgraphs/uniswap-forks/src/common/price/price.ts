import { log } from "@graphprotocol/graph-ts/index";
import { BigDecimal } from "@graphprotocol/graph-ts/index";
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateToken, getOrCreateTokenWhitelist } from "./../getters";
import { Token, _HelperStore, _LiquidityPoolAmount } from "../../../generated/schema";
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGDECIMAL_TWO, BIGINT_ZERO, MINIMUM_LIQUIDITY_THRESHOLD } from "./../constants";
import { safeDiv } from "../utils/utils";
import { NetworkConfigs } from "../../../config/_networkConfig";

export function updateNativeTokenPriceInUSD(): Token {
  let nativeAmount = BIGDECIMAL_ZERO;
  let stableAmount = BIGDECIMAL_ZERO;
  let nativeToken = getOrCreateToken(NetworkConfigs.NATIVE_TOKEN);
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < NetworkConfigs.STABLE_ORACLE_POOLS.length; i++) {
    let pool = _LiquidityPoolAmount.load(NetworkConfigs.STABLE_ORACLE_POOLS[i]);
    if (!pool) continue;
    if (pool.inputTokens[0] == NetworkConfigs.NATIVE_TOKEN) {
      if (pool.inputTokenBalances[1] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[0];
        stableAmount = pool.inputTokenBalances[1];
      }
    } else {
      if (pool.inputTokenBalances[0] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[1];
        stableAmount = pool.inputTokenBalances[0];
      }
    }
  }
  nativeToken.lastPriceUSD = safeDiv(stableAmount, nativeAmount);
  return nativeToken;
}

/**
 * Search through graph to find derived Native Token token.
 * @todo update to be derived Native Token (add stablecoin estimates)
 **/

export function findNativeTokenPerToken(token: Token, nativeToken: Token): BigDecimal {
  if (token.id == NetworkConfigs.NATIVE_TOKEN) {
    return nativeToken.lastPriceUSD!;
  }
  let tokenWhitelist = getOrCreateTokenWhitelist(token.id);
  let whiteList = tokenWhitelist.whitelistPools;
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityNativeToken = BIGDECIMAL_ZERO;
  let priceSoFar = BIGDECIMAL_ZERO;

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (NetworkConfigs.STABLE_COINS.includes(token.id)) {
    priceSoFar = safeDiv(BIGDECIMAL_ONE, nativeToken.lastPriceUSD!);
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i];
      let poolAmounts = getLiquidityPoolAmounts(poolAddress);
      let pool = getLiquidityPool(poolAddress);

      if (pool.outputTokenSupply!.gt(BIGINT_ZERO)) {
        if (pool.inputTokens[0] == token.id) {
          // whitelist token is token1
          let token1 = getOrCreateToken(pool.inputTokens[1]);
          // get the derived NativeToken in pool
          let nativeTokenLocked = poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!);
          if (nativeTokenLocked.gt(largestLiquidityNativeToken) && nativeTokenLocked.gt(MINIMUM_LIQUIDITY_THRESHOLD)) {
            largestLiquidityNativeToken = nativeTokenLocked;
            // token1 per our token * nativeToken per token1
            priceSoFar = safeDiv(poolAmounts.inputTokenBalances[1], poolAmounts.inputTokenBalances[0]).times(token1.lastPriceUSD! as BigDecimal);
          }
        }
        if (pool.inputTokens[1] == token.id) {
          let token0 = getOrCreateToken(pool.inputTokens[0]);
          // get the derived nativeToken in pool
          let nativeTokenLocked = poolAmounts.inputTokenBalances[0].times(token0.lastPriceUSD!);
          if (nativeTokenLocked.gt(largestLiquidityNativeToken) && nativeTokenLocked.gt(MINIMUM_LIQUIDITY_THRESHOLD)) {
            largestLiquidityNativeToken = nativeTokenLocked;
            // token0 per our token * NativeToken per token0
            priceSoFar = safeDiv(poolAmounts.inputTokenBalances[0], poolAmounts.inputTokenBalances[1]).times(token0.lastPriceUSD! as BigDecimal);
          }
        }
      }
    }
  }
  return priceSoFar; // nothing was found return 0
}

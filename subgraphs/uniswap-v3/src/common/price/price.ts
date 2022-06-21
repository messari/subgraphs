// import { log } from '@graphprotocol/graph-ts'
import { _HelperStore, _LiquidityPoolAmount, Token, LiquidityPool } from "../../../generated/schema";
import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateToken, getOrCreateTokenWhitelist } from "../getters";
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGINT_ZERO, BIGDECIMAL_TWO, Q192, INT_ONE, INT_ZERO } from "../constants";
import { exponentToBigDecimal, safeDiv } from "../utils/utils";
import { NetworkConfigs } from "../../../configurations/configure";

export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: Token, token1: Token): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  let denom = BigDecimal.fromString(Q192.toString());
  let price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0.decimals))
    .div(exponentToBigDecimal(token1.decimals));

  let price0 = safeDiv(BIGDECIMAL_ONE, price1);
  return [price0, price1];
}

export function updateNativeTokenPriceInUSD(): Token {
  let nativeToken = getOrCreateToken(NetworkConfigs.getReferenceToken());

  let stableAmount = BIGDECIMAL_ZERO;
  let tokenIndicator: i32;
  let largestPool = _LiquidityPoolAmount.load(NetworkConfigs.getStableOraclePools()[0]);

  if (largestPool == null) {
    log.warning("No STABLE_ORACLE_POOLS given", []);
    return nativeToken;
  }

  if (largestPool.inputTokens[INT_ZERO] == NetworkConfigs.getReferenceToken()) {
    tokenIndicator = INT_ONE;
  } else {
    tokenIndicator = INT_ZERO;
  }

  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = INT_ZERO; i < NetworkConfigs.getStableOraclePools().length; i++) {
    let pool = _LiquidityPoolAmount.load(NetworkConfigs.getStableOraclePools()[i]);
    if (!pool) continue;
    if (pool.inputTokens[INT_ZERO] == NetworkConfigs.getReferenceToken()) {
      if (pool.inputTokenBalances[INT_ONE] > stableAmount) {
        stableAmount = pool.inputTokenBalances[INT_ONE];
        largestPool = pool;
        tokenIndicator = INT_ONE;
      }
    } else {
      if (pool.inputTokenBalances[INT_ZERO] > stableAmount) {
        stableAmount = pool.inputTokenBalances[INT_ZERO];
        largestPool = pool;
        tokenIndicator = INT_ZERO;
      }
    }
  }
  if (stableAmount.notEqual(BIGDECIMAL_ZERO)) {
    nativeToken.lastPriceUSD = largestPool.tokenPrices[tokenIndicator];
  }

  log.warning("NATIVE PRICE: " + nativeToken.lastPriceUSD!.toString(), []);
  return nativeToken;
}

/**
 * Search through graph to find derived NativeToken per token.
 * @todo update to be derived NativeToken (add stablecoin estimates)
 **/

export function findNativeTokenPerToken(token: Token, nativeToken: Token): BigDecimal {
  if (token.id == NetworkConfigs.getReferenceToken()) {
    return nativeToken.lastPriceUSD!;
  }

  let tokenWhitelist = getOrCreateTokenWhitelist(token.id);
  let whiteList = tokenWhitelist.whitelistPools;
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestNativeTokenValue = BIGDECIMAL_ZERO;
  let priceSoFar = BIGDECIMAL_ZERO;

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (NetworkConfigs.getStableCoins().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ONE;
  } else if (NetworkConfigs.getUntrackedTokens().includes(token.id)) {
    priceSoFar = BIGDECIMAL_ZERO;
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
          let nativeTokenValueLocked = poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!);
          if (nativeTokenValueLocked.gt(largestNativeTokenValue) && nativeTokenValueLocked.gt(NetworkConfigs.getMinimumLiquidityThreshold())) {
            largestNativeTokenValue = nativeTokenValueLocked;
            // token1 per our token * NativeToken per token1
            priceSoFar = poolAmounts.tokenPrices[1].times(token1.lastPriceUSD as BigDecimal);
          }
        }
        if (pool.inputTokens[1] == token.id) {
          let token0 = getOrCreateToken(pool.inputTokens[0]);
          // get the derived NativeToken in pool
          let nativeTokenValueLocked = poolAmounts.inputTokenBalances[0].times(token0.lastPriceUSD!);
          if (nativeTokenValueLocked.gt(largestNativeTokenValue) && nativeTokenValueLocked.gt(NetworkConfigs.getMinimumLiquidityThreshold())) {
            largestNativeTokenValue = nativeTokenValueLocked;
            // token0 per our token * NativeToken per token0
            priceSoFar = poolAmounts.tokenPrices[0].times(token0.lastPriceUSD as BigDecimal);
          }
        }
      }
    }
  }
  return priceSoFar; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 * Also, return the value of the valume for each token if it is contained in the whitelist
 */

export function getTrackedVolumeUSD(pool: _LiquidityPoolAmount, tokenAmount0: BigDecimal, token0: Token, tokenAmount1: BigDecimal, token1: Token): BigDecimal[] {
  let price0USD = token0.lastPriceUSD!;
  let price1USD = token1.lastPriceUSD!;

  // dont count tracked volume on these pairs - usually rebass tokens
  if (NetworkConfigs.getUntrackedPairs().includes(pool.id)) {
    return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  }

  let poolDeposits = _HelperStore.load(pool.id);
  if (poolDeposits == null) return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    let reserve0USD = pool.inputTokenBalances[0].times(price0USD);
    let reserve1USD = pool.inputTokenBalances[1].times(price1USD);
    if (NetworkConfigs.getWhitelistTokens().includes(token0.id) && NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
      if (reserve0USD.plus(reserve1USD).lt(NetworkConfigs.getMinimumLiquidityThreshold())) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (NetworkConfigs.getWhitelistTokens().includes(token0.id) && !NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
      if (reserve0USD.times(BIGDECIMAL_TWO).lt(NetworkConfigs.getMinimumLiquidityThreshold())) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
    if (!NetworkConfigs.getWhitelistTokens().includes(token0.id) && NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
      if (reserve1USD.times(BIGDECIMAL_TWO).lt(NetworkConfigs.getMinimumLiquidityThreshold())) {
        return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
      }
    }
  }

  // both are whitelist tokens, return sum of both amounts
  if (NetworkConfigs.getWhitelistTokens().includes(token0.id) && NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
    let token0ValueUSD = tokenAmount0.times(price0USD);
    let token1ValueUSD = tokenAmount1.times(price1USD);

    return [token0ValueUSD, token1ValueUSD, token0ValueUSD.plus(token1ValueUSD).div(BIGDECIMAL_TWO)];
  }

  // take double value of the whitelisted token amount
  if (NetworkConfigs.getWhitelistTokens().includes(token0.id) && !NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
    return [tokenAmount0.times(price0USD), BIGDECIMAL_ZERO, tokenAmount0.times(price0USD)];
  }

  // take double value of the whitelisted token amount
  if (!NetworkConfigs.getWhitelistTokens().includes(token0.id) && NetworkConfigs.getWhitelistTokens().includes(token1.id)) {
    return [BIGDECIMAL_ZERO, tokenAmount1.times(price1USD), tokenAmount1.times(price1USD)];
  }

  // neither token is on white list, tracked amount is 0
  return [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
}

import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { _HelperStore, _LiquidityPoolAmounts, _TokenTracker } from "../../generated/schema";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
} from "./constant";
import { NetworkConfigs } from "../../config/_networkConfig";
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from "./getters";
import { safeDiv } from "./helpers";

function token0PairPrice(pool: _LiquidityPoolAmounts): BigDecimal {
  if (pool.inputTokenBalances[1].notEqual(BIGDECIMAL_ZERO)) {
    return pool.inputTokenBalances[0].div(pool.inputTokenBalances[1])
  }
  else return BIGDECIMAL_ZERO
}
function token1PairPrice(pool: _LiquidityPoolAmounts): BigDecimal {
  if (pool.inputTokenBalances[0].notEqual(BIGDECIMAL_ZERO)) {
    return pool.inputTokenBalances[1].div(pool.inputTokenBalances[0])
  }
  else return BIGDECIMAL_ZERO
}


export function getEthPriceInUSD(): BigDecimal {
  let nativeAmount = BIGDECIMAL_ZERO
  let stableAmount; BIGDECIMAL_ZERO
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < NetworkConfigs.STABLE_ORACLE_POOLS.length; i++) {
    let pool = _LiquidityPoolAmounts.load(NetworkConfigs.STABLE_ORACLE_POOLS[i]);
    if (!pool) continue
    if (pool.inputTokens[0] = NetworkConfigs.NATIVE_TOKEN) {
      nativeAmount += pool.inputTokenBalances[0]
      stableAmount += pool.inputTokenBalances[1]
    }
  }
  if (stableAmount.notEqual(BIGDECIMAL_ZERO)) {
    return nativeAmount.div(stableAmount)
  } else return BIGDECIMAL_ZERO
}

export function findEthPerToken(tokenTracker: _TokenTracker): BigDecimal {
  if (tokenTracker.id == NetworkConfigs.NATIVE_TOKEN) {
    return BIGDECIMAL_ONE
  }
  let whiteList = tokenTracker.whitelistPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityETH = BIGDECIMAL_ZERO
  let priceSoFar = BIGDECIMAL_ZERO
  let ether = getOrCreateEtherHelper()

  // hardcoded fix for incorrect rates
  // if whitelist includes token - get the safe price
  if (NetworkConfigs.STABLE_COINS.includes(tokenTracker.id)) {
    priceSoFar = safeDiv(BIGDECIMAL_ONE, ether.valueDecimal!)
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i]
      let poolAmounts = getLiquidityPoolAmounts(poolAddress)
      let pool = getLiquidityPool(poolAddress)

      if (pool.outputTokenSupply!.gt(BIGINT_ZERO)) {
        if (pool.inputTokens[0] == tokenTracker.id) {
          // whitelist token is token1
          let tokenTracker1 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))
          // get the derived ETH in pool
          let ethLocked = poolAmounts.inputTokenBalances[1].times(tokenTracker1.derivedETH)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
            largestLiquidityETH = ethLocked
            // token1 per our token * Eth per token1
            priceSoFar = token1PairPrice(poolAmounts).times(tokenTracker1.derivedETH as BigDecimal)
          }
        }
        if (pool.inputTokens[1] == tokenTracker.id) {
          let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
          // get the derived ETH in pool
          let ethLocked = poolAmounts.inputTokenBalances[0].times(tokenTracker0.derivedETH)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
            largestLiquidityETH = ethLocked
            // token0 per our token * ETH per token0
            priceSoFar = token0PairPrice(poolAmounts).times(tokenTracker0.derivedETH as BigDecimal)
          }
        }
      }
    }
  }
  return priceSoFar // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
 export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  tokenTracker0: _TokenTracker,
  tokenAmount1: BigDecimal,
  tokenTracker1: _TokenTracker,
  pool: _LiquidityPoolAmounts
): BigDecimal {

  let ether = getOrCreateEtherHelper()

  let price0 = tokenTracker0.derivedETH.times(ether.valueDecimal!)
  let price1 = tokenTracker1.derivedETH.times(ether.valueDecimal!)

  // dont count tracked volume on these pairs - usually rebass tokens
  if (UNTRACKED_PAIRS.includes(pool.id)) {
    return BIGDECIMAL_ZERO
  }

  let poolDeposits = _HelperStore.load(pool.id)
  if (poolDeposits == null) return BIGDECIMAL_ZERO

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    let reserve0USD = pool.inputTokenBalances[0].times(price0)
    let reserve1USD = pool.inputTokenBalances[1].times(price1)
    if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
      if (reserve0USD.plus(reserve1USD).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
    if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && !NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
      if (reserve0USD.times(BIGDECIMAL_TWO).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
    if (!NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
      if (reserve1USD.times(BIGDECIMAL_TWO).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
  }

  // both are NetworkConfigs.WHITELIST_TOKENS tokens, take average of both amounts
  if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BIGDECIMAL_TWO)
  }

  // take full value of the NetworkConfigs.WHITELIST_TOKENSed token amount
  if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && !NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount0.times(price0)
  } 

  // take full value of the NetworkConfigs.WHITELIST_TOKENSed token amount
  if (!NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkConfigs.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return BIGDECIMAL_ZERO
}
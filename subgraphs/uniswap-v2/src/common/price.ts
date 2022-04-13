// import { log } from '@graphprotocol/graph-ts/index'
import { BigDecimal, Address } from '@graphprotocol/graph-ts/index'
import { UNTRACKED_PAIRS } from './creators'
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from './getters'
import { _HelperStore, _LiquidityPoolAmounts, _TokenTracker } from '../../generated/schema'
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGDECIMAL_TWO, BIGINT_ZERO, NATIVE_TOKEN, STABLE_ORACLE_POOLS, MINIMUM_LIQUIDITY_THRESHOLD_ETH, STABLE_COINS, WHITELIST, MINIMUM_USD_THRESHOLD_NEW_PAIRS} from './constants'
import { safeDiv } from './utils'

export function getEthPriceInUSD(): BigDecimal {
  let nativeAmount = BIGDECIMAL_ZERO
  let stableAmount = BIGDECIMAL_ZERO
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < STABLE_ORACLE_POOLS.length; i++) {
    let pool = _LiquidityPoolAmounts.load(STABLE_ORACLE_POOLS[i]);
    if (!pool) continue
    if (pool.inputTokens[0] = NATIVE_TOKEN) {
      nativeAmount = nativeAmount.plus(pool.inputTokenBalances[0])
      stableAmount = stableAmount.plus(pool.inputTokenBalances[1])
    }
  }
  if (stableAmount.notEqual(BIGDECIMAL_ZERO)) {
    return nativeAmount.div(stableAmount)
  } else return BIGDECIMAL_ZERO
}

export function findEthPerToken(tokenTracker: _TokenTracker): BigDecimal {
  if (tokenTracker.id == NATIVE_TOKEN) {
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
  if (STABLE_COINS.includes(tokenTracker.id)) {
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
            priceSoFar = safeDiv(poolAmounts.inputTokenBalances[1], poolAmounts.inputTokenBalances[0]).times(tokenTracker1.derivedETH as BigDecimal)
          }
        }
        if (pool.inputTokens[1] == tokenTracker.id) {
          let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
          // get the derived ETH in pool
          let ethLocked = poolAmounts.inputTokenBalances[0].times(tokenTracker0.derivedETH)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
            largestLiquidityETH = ethLocked
            // token0 per our token * ETH per token0
            priceSoFar = safeDiv(poolAmounts.inputTokenBalances[0], poolAmounts.inputTokenBalances[1]).times(tokenTracker0.derivedETH as BigDecimal)
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
    if (WHITELIST.includes(tokenTracker0.id) && WHITELIST.includes(tokenTracker1.id)) {
      if (reserve0USD.plus(reserve1USD).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
    if (WHITELIST.includes(tokenTracker0.id) && !WHITELIST.includes(tokenTracker1.id)) {
      if (reserve0USD.times(BIGDECIMAL_TWO).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
    if (!WHITELIST.includes(tokenTracker0.id) && WHITELIST.includes(tokenTracker1.id)) {
      if (reserve1USD.times(BIGDECIMAL_TWO).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return BIGDECIMAL_ZERO
      }
    }
  }

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(tokenTracker0.id) && WHITELIST.includes(tokenTracker1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BIGDECIMAL_TWO)
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(tokenTracker0.id) && !WHITELIST.includes(tokenTracker1.id)) {
    return tokenAmount0.times(price0)
  } 

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(tokenTracker0.id) && WHITELIST.includes(tokenTracker1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return BIGDECIMAL_ZERO
}

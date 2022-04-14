// import { log } from '@graphprotocol/graph-ts'
import { _HelperStore, _TokenTracker, _LiquidityPoolAmount } from '../../../generated/schema'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from '../getters'
import { NetworkParameters } from '../../../config/_paramConfig'
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGINT_ZERO, BIGDECIMAL_TWO } from '../constants'
import { safeDiv } from '../utils/utils'

export function getEthPriceInUSD(): BigDecimal {
  let nativeAmount = BIGDECIMAL_ZERO
  let stableAmount = BIGDECIMAL_ZERO
  // fetch average price of NATIVE_TOKEN_ADDRESS from STABLE_ORACLES
  for (let i = 0; i < NetworkParameters.STABLE_ORACLE_POOLS.length; i++) {
    let pool = _LiquidityPoolAmount.load(NetworkParameters.STABLE_ORACLE_POOLS[i].toLowerCase());
    if (!pool) continue
    if (pool.inputTokens[0] == NetworkParameters.NATIVE_TOKEN) {
      if (pool.inputTokenBalances[1] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[0]
        stableAmount = pool.inputTokenBalances[1]
      }
    } else {
      if (pool.inputTokenBalances[0] > stableAmount) {
        nativeAmount = pool.inputTokenBalances[1]
        stableAmount = pool.inputTokenBalances[0]
      }
    }
  }
  if (stableAmount.notEqual(BIGDECIMAL_ZERO)) {
    return stableAmount.div(nativeAmount)
  } else {
    return BIGDECIMAL_ZERO
  }
}

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/

 export function findEthPerToken(tokenTracker: _TokenTracker): BigDecimal {
  if (tokenTracker.id == NetworkParameters.NATIVE_TOKEN) {
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
  if (NetworkParameters.STABLE_COINS.includes(tokenTracker.id)) {
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
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(NetworkParameters.MINIMUM_ETH_LOCKED)) {
            largestLiquidityETH = ethLocked
            // token1 per our token * Eth per token1
            priceSoFar = safeDiv(poolAmounts.inputTokenBalances[1], poolAmounts.inputTokenBalances[0]).times(tokenTracker1.derivedETH as BigDecimal)
          }
        }
        if (pool.inputTokens[1] == tokenTracker.id) {
          let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
          // get the derived ETH in pool
          let ethLocked = poolAmounts.inputTokenBalances[0].times(tokenTracker0.derivedETH)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(NetworkParameters.MINIMUM_ETH_LOCKED)) {
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
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedAmountUSD(
  tokenAmount0: BigDecimal,
  tokenTracker0: _TokenTracker,
  tokenAmount1: BigDecimal,
  tokenTracker1: _TokenTracker
): BigDecimal {

  let ether = getOrCreateEtherHelper()

  let price0USD = tokenTracker0.derivedETH.times(ether.valueDecimal!)
  let price1USD = tokenTracker1.derivedETH.times(ether.valueDecimal!)

  // both are whitelist tokens, return sum of both amounts
  if (NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount0.times(price0USD).plus(tokenAmount1.times(price1USD))
  }

  // take double value of the whitelisted token amount
  if (NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker0.id) && !NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount0.times(price0USD).times(BIGDECIMAL_TWO)
  }

  // take double value of the whitelisted token amount
  if (!NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker0.id) && NetworkParameters.WHITELIST_TOKENS.includes(tokenTracker1.id)) {
    return tokenAmount1.times(price1USD).times(BIGDECIMAL_TWO)
  }

  // neither token is on white list, tracked amount is 0
  return BIGDECIMAL_ZERO
}



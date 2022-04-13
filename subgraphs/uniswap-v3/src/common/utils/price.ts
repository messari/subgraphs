// import { log } from '@graphprotocol/graph-ts'
import { BIGDECIMAL_ONE, BIGDECIMAL_TWO, BIGDECIMAL_ZERO, BIGINT_ZERO } from './constants'
import { _HelperStore, _TokenTracker, _LiquidityPoolAmount } from '../../../generated/schema'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { safeDiv } from '../helpers'
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from '../getters'
import { NetworkParameters } from '../../../config/_paramConfig'

let MINIMUM_ETH_LOCKED = BigDecimal.fromString('60')

function token0PairPrice(poolAmounts: _LiquidityPoolAmount): BigDecimal {
  if (poolAmounts.inputTokenBalances[1].notEqual(BIGDECIMAL_ZERO)) return poolAmounts.inputTokenBalances[0].div(poolAmounts.inputTokenBalances[1])
  else return BIGDECIMAL_ZERO
}
function token1PairPrice(poolAmounts: _LiquidityPoolAmount): BigDecimal {
  if (poolAmounts.inputTokenBalances[0].notEqual(BIGDECIMAL_ZERO)) return poolAmounts.inputTokenBalances[1].div(poolAmounts.inputTokenBalances[0])
  else return BIGDECIMAL_ZERO
}

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let poolAmounts = _LiquidityPoolAmount.load(NetworkParameters.NATIVE_TOKEN_STABLE_COIN_POOL)
  if (poolAmounts !== null) {
    if (poolAmounts.inputTokenBalances[0] >= poolAmounts.inputTokenBalances[1]) return token0PairPrice(poolAmounts)
    return token1PairPrice(poolAmounts)
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
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
            largestLiquidityETH = ethLocked
            // token1 per our token * Eth per token1
            priceSoFar = token1PairPrice(poolAmounts).times(tokenTracker1.derivedETH as BigDecimal)
          }
        }
        if (pool.inputTokens[1] == tokenTracker.id) {
          let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[0]))
          // get the derived ETH in pool
          let ethLocked = poolAmounts.inputTokenBalances[0].times(tokenTracker0.derivedETH)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
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



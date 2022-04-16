// import { log } from '@graphprotocol/graph-ts/index'
import { BigDecimal } from '@graphprotocol/graph-ts/index'
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from './../getters'
import { _HelperStore, _LiquidityPoolAmount, _TokenTracker } from '../../../generated/schema'
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, BIGDECIMAL_TWO, BIGINT_ZERO, NATIVE_TOKEN, STABLE_ORACLE_POOLS, MINIMUM_LIQUIDITY_THRESHOLD_ETH, STABLE_COINS, WHITELIST, MINIMUM_USD_THRESHOLD_NEW_PAIRS, UNTRACKED_PAIRS} from './../constants'

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
  pool: _LiquidityPoolAmount
): BigDecimal {

  // dont count tracked volume on these pairs - usually rebass tokens
  if (UNTRACKED_PAIRS.includes(pool.id)) {
    return BIGDECIMAL_ZERO
  }

  let poolDeposits = _HelperStore.load(pool.id)
  if (poolDeposits == null) return BIGDECIMAL_ZERO

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  // Updated from original subgraph. Number of deposits may not equal number of liquidity providers
  if (poolDeposits.valueInt < 5) {
    let reserve0USD = pool.inputTokenBalances[0].times(tokenTracker0.derivedUSD)
    let reserve1USD = pool.inputTokenBalances[1].times(tokenTracker1.derivedUSD)
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
      .times(tokenTracker0.derivedUSD)
      .plus(tokenAmount1.times(tokenTracker1.derivedUSD))
      .div(BIGDECIMAL_TWO)
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(tokenTracker0.id) && !WHITELIST.includes(tokenTracker1.id)) {
    return tokenAmount0.times(tokenTracker0.derivedUSD)
  } 

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(tokenTracker0.id) && WHITELIST.includes(tokenTracker1.id)) {
    return tokenAmount1.times(tokenTracker1.derivedUSD)
  }

  // neither token is on white list, tracked volume is 0
  return BIGDECIMAL_ZERO
}

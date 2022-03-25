// import { log } from '@graphprotocol/graph-ts/index'
import { BigDecimal, Address } from '@graphprotocol/graph-ts/index'
import { UNTRACKED_PAIRS, safeDiv } from './helpers'
import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateEtherHelper, getOrCreateTokenTracker } from './getters'
import { _HelperStore, _LiquidityPoolAmounts, _TokenTracker } from '../../generated/schema'
import { BIGDECIMAL_ZERO, BIGDECIMAL_ONE, WETH_ADDRESS, USDC_WETH_PAIR, DAI_WETH_PAIR, USDT_WETH_PAIR, BIGDECIMAL_TWO, BIGINT_ZERO} from '../common/constants'

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
  // fetch eth prices for each stablecoin
  let daiPair = _LiquidityPoolAmounts.load(DAI_WETH_PAIR) // dai is token0
  let usdcPair = _LiquidityPoolAmounts.load(USDC_WETH_PAIR) // usdc is token0
  let usdtPair = _LiquidityPoolAmounts.load(USDT_WETH_PAIR) // usdt is token1

  // all 3 have been created
  if (daiPair !== null && usdcPair !== null && usdtPair !== null) {

    let totalLiquidityETH = daiPair.inputTokenBalances[1].plus(usdcPair.inputTokenBalances[1]).plus(usdtPair.inputTokenBalances[0])
    if (totalLiquidityETH == BIGDECIMAL_ZERO) return BIGDECIMAL_ZERO
    let daiWeight = daiPair.inputTokenBalances[1].div(totalLiquidityETH)
    let usdcWeight = usdcPair.inputTokenBalances[1].div(totalLiquidityETH)
    let usdtWeight = usdtPair.inputTokenBalances[0].div(totalLiquidityETH)

    return token0PairPrice(daiPair)
      .times(daiWeight)
      .plus(token0PairPrice(usdcPair).times(usdcWeight))
      .plus(token1PairPrice(usdtPair).times(usdtWeight))
    // dai and USDC have been created
  } else if (daiPair !== null && usdcPair !== null) {
    let totalLiquidityETH = daiPair.inputTokenBalances[1].plus(usdcPair.inputTokenBalances[1])
    let daiWeight = daiPair.inputTokenBalances[1].div(totalLiquidityETH)
    let usdcWeight = usdcPair.inputTokenBalances[1].div(totalLiquidityETH)
    return token0PairPrice(daiPair).times(daiWeight).plus(token0PairPrice(usdcPair).times(usdcWeight))
    // USDC is the only pair so far
  } else if (usdcPair !== null) {
    return token0PairPrice(usdcPair)
  } else {
    return BIGDECIMAL_ONE
  }
}

// token where amounts should contribute to tracked volume and liquidity
export let WHITELIST: string[] = [
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x514910771af9ca656af840dff83e8264ecf986ca', //LINK
  '0x960b236a07cf122663c4303350609a66a7b288c0', //ANT
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', //SNX
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', //YFI
  '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
  '0x853d955acef822db058eb8505911ed77f175b99e', // FRAX
  '0xa47c8bf37f92abed4a126bda807a7b7498661acd', // WUST
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' // WBTC
]

export let STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
  '0x4dd28568d05f09b02220b09c2cb307bfd837cb95'
]

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('400000')

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('1')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
// export function findEthPerToken(token: Token): BigDecimal {
//   if (token.id == WETH_ADDRESS) {
//     return BIGDECIMAL_ONE
//   }
//   // loop through whitelist and check if paired with any
//   for (let i = 0; i < WHITELIST.length; ++i) {
//     let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
//     if (pairAddress.toHexString() != ZERO_ADDRESS) {
//       let pair = LiquidityPool.load(pairAddress.toHexString())
//       if (pair == null){
//         return BIGDECIMAL_ZERO
//       }
//       let token1 = Token.load(pair.inputTokens[1])
//       if (token1 == null){
//         return BIGDECIMAL_ZERO
//       }
//       let token1EthPrice = findEthPerToken(token1)
//       if (pair.inputTokens[0] == token.id && token1EthPrice.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
//         return token1PairPrice(pair).times(token1EthPrice as BigDecimal) // return token1 per our token * Eth per token 1
//       }
//       let token0 = Token.load(pair.inputTokens[0])
//       if (token0 == null){
//         return BIGDECIMAL_ZERO
//       }
//       let token0EthPrice = findEthPerToken(token0)

//       if (pair.inputTokens[1] == token.id && token0EthPrice.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
//         return token0PairPrice(pair).times(token0EthPrice as BigDecimal) // return token0 per our token * ETH per token 0
//       }
//     }
//   }
//   return BIGDECIMAL_ZERO // nothing was found return 0
// }


export function findEthPerToken(tokenTracker: _TokenTracker): BigDecimal {
  if (tokenTracker.id == WETH_ADDRESS) {
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

      if (pool.outputTokenSupply.gt(BIGINT_ZERO)) {
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
          let tokenTracker0 = getOrCreateTokenTracker(Address.fromString(pool.inputTokens[1]))
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

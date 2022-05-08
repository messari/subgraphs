import {
  LiquidityPool,
  Token
} from '../../generated/schema'
import { Address, BigDecimal, BigInt, dataSource, log } from '@graphprotocol/graph-ts'
import {
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E8,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  FOREX_ORACLES,
  FOREX_TOKENS,
  USDT_ADDRESS,
  WBTC_ADDRESS,
  SYNTH_TOKENS,
  WETH_ADDRESS,
  BIG_DECIMAL_TWO, BIG_INT_ZERO
} from '../common/constants/index'
import { CurvePool } from '../../generated/templates/CurvePoolTemplate/CurvePool'
import { getPlatform } from './platform'
import { ChainlinkAggregator } from '../../generated/templates/CurvePoolTemplateV2/ChainlinkAggregator'
import { CurvePoolV2 } from '../../generated/templates/RegistryTemplate/CurvePoolV2'
import {
  CurvePoolCoin128
} from '../../generated/templates/RegistryTemplate/CurvePoolCoin128'
import { getUsdRate } from '../common/pricing'
import { exponentToBigDecimal } from '../common/utils/numbers'
import { DAY, getIntervalFromTimestamp } from '../common/utils/datetime'
import { getOrCreateToken } from '../common/getters'
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO } from '../common/constants'

export function getForexUsdRate(token: string): BigDecimal {
  // returns the amount of USD 1 unit of the foreign currency is worth
  const priceOracle = ChainlinkAggregator.bind(FOREX_ORACLES.get(token))
  const conversionRateReponse = priceOracle.try_latestAnswer()
  const conversionRate = conversionRateReponse.reverted
    ? BIG_DECIMAL_ONE
    : conversionRateReponse.value.toBigDecimal().div(BIG_DECIMAL_1E8)
  log.debug('Answer from Forex oracle {} for token {}: {}', [
    FOREX_ORACLES.get(token).toHexString(),
    token,
    conversionRate.toString(),
  ])
  
  return conversionRate
}

export function getTokenPriceSnapshot(tokenAddr: Address, blockNumber: BigInt, forex: boolean): BigDecimal {
  let token = getOrCreateToken(tokenAddr)
  let priceUSD = BIGDECIMAL_ZERO;
  if (forex) {
    priceUSD = getForexUsdRate(tokenAddr.toHexString())
  } else {
    priceUSD = getUsdRate(tokenAddr)
  }
  token.lastPriceUSD = priceUSD
  token.lastPriceBlockNumber = blockNumber;
  token.save()
  return priceUSD
}

export function getStableCryptoTokenPrice(pool: LiquidityPool, blockNumber: BigInt): BigDecimal {
  // we use this for stable crypto pools where one assets may not be traded
  // outside of curve. we just try to get a price out of one of the assets traded
  // and use that
  let price = BIG_DECIMAL_ZERO
  for (let i = 0; i < pool.inputTokens.length; ++i) {
    price = getUsdRate(Address.fromString(pool.inputTokens[i]))
    if (price != BIG_DECIMAL_ZERO) {
      break
    }
  }
  return price
}

export function getCryptoTokenSnapshot(tokenAddr: Address, blockNumber: BigInt, pool: LiquidityPool): BigDecimal {
  let token = getOrCreateToken(tokenAddr)
  let price = FOREX_TOKENS.includes(tokenAddr.toHexString()) ? getForexUsdRate(tokenAddr.toHexString()) : getUsdRate(tokenAddr)
  if (price == BIG_DECIMAL_ZERO && SYNTH_TOKENS.has(tokenAddr.toHexString())) {
    log.warning('Invalid price found for {}', [tokenAddr.toHexString()])
    price = getUsdRate(SYNTH_TOKENS.get(tokenAddr.toHexString()))
    const poolContract = CurvePoolV2.bind(Address.fromString(pool.id))
    const priceOracleResult = poolContract.try_price_oracle()
    if (!priceOracleResult.reverted) {
      price = price.times(priceOracleResult.value.toBigDecimal().div(BIG_DECIMAL_1E18))
    } else {
      log.warning('Price oracle reverted {}', [tokenAddr.toHexString()])
    }
  }
  token.lastPriceUSD = price;
  token.lastPriceBlockNumber = blockNumber;
  token.save()
  return price
}

export function getTokenSnapshotByAssetType(pool: LiquidityPool, blockNumber: BigInt): BigDecimal {
  if (FOREX_ORACLES.has(pool.id)) {
    return getTokenPriceSnapshot(Address.fromString(pool.outputToken!), blockNumber, true)
  } else if (pool.assetType == 1) {
    return getTokenPriceSnapshot(WETH_ADDRESS, blockNumber, false)
  } else if (pool.assetType == 2) {
    return getTokenPriceSnapshot(WBTC_ADDRESS, blockNumber, false)
  } else if (pool.assetType == 0) {
    return BIGDECIMAL_ONE
  } else {
    return getStableCryptoTokenPrice(pool, blockNumber)
  }
}

export function getLpTokenPriceUSD(pool: LiquidityPool, blockNumber: BigInt): BigDecimal {
  let curvePool = CurvePool.bind(Address.fromString(pool.id));
  let assetPriceUSD = getTokenSnapshotByAssetType(pool, blockNumber);
  let virtualPrice = curvePool.try_get_virtual_price();
  if (virtualPrice.reverted) {
    return assetPriceUSD
  }
  return assetPriceUSD.times(virtualPrice.value.toBigDecimal().div(BIG_DECIMAL_1E18))
}

export function takePoolSnapshots(timestamp: BigInt): void {
  const platform = getPlatform()
  for (let i = 0; i < platform.poolAddresses.length; ++i) {
    const poolAddress = platform.poolAddresses[i]
    const pool = LiquidityPool.load(poolAddress)
    if (!pool) {
      return
    }
    const poolContract = CurvePoolV2.bind(Address.fromString(pool.id))
      //if (pool.isV2) {
        //const xcpProfitResult = poolContract.try_xcp_profit()
        //const xcpProfitAResult = poolContract.try_xcp_profit_a()
        //dailySnapshot.xcpProfit = xcpProfitResult.reverted ? BIG_DECIMAL_ZERO : xcpProfitResult.value.toBigDecimal()
        //dailySnapshot.xcpProfitA = xcpProfitAResult.reverted ? BIG_DECIMAL_ZERO : xcpProfitAResult.value.toBigDecimal()
        // dailySnapshot.baseApr = getV2PoolBaseApr(pool, dailySnapshot.xcpProfit, dailySnapshot.xcpProfitA, timestamp)
    //  } else {
      //   dailySnapshot.baseApr = getPoolBaseApr(pool, dailySnapshot.virtualPrice, timestamp)
    //  }



    pool.save()
  }
}

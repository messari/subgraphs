import { Address, BigDecimal, dataSource, log } from "@graphprotocol/graph-ts";
import { HelperStore, LiquidityPool, Token } from "../../generated/schema";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BSC, factoryContract, Network, POLYGON, ZERO_ADDRESS } from "./constant";
import { getOrCreateToken } from "./token";

// Address of the wrapped native token(eg WBNB for bsc and WMATIC for polygon)
const WRAPPED_NATIVE_TOKEN_ADDRESS = dataSource.network() == Network.BSC.toLowerCase() ? BSC.WBNB_ADDRESS : POLYGON.WMATIC_ADDRESS;

export function baseTokenPriceInUSD(): BigDecimal {
  log.info("Network: {}", [dataSource.network()]);
  if (dataSource.network() == Network.BSC.toLowerCase()) {
    return bnbPriceInUSD();
  } else if (dataSource.network() == Network.POLYGON.toLowerCase()) {
    return wmaticPriceInUSD();
  } else {
    return BIGDECIMAL_ZERO;
  }
}

function bnbPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdtPair = LiquidityPool.load(
    Address.fromString(BSC.USDT_WBNB_PAIR).toHexString(), // usdt is token0
  ); // usdt is token0
  let busdPair = LiquidityPool.load(
    Address.fromString(BSC.BUSD_WBNB_PAIR).toHexString(), // busd is token1
  ); // busd is token1
  let daiPair = LiquidityPool.load(
    Address.fromString(BSC.DAI_WBNB_PAIR).toHexString(), // dai is token0
  ); // dai is token1

  if (busdPair !== null && usdtPair !== null && daiPair !== null) {
    let totalLiquidityBNB = daiPair._reserve1.plus(busdPair._reserve0).plus(usdtPair._reserve1);
    if (totalLiquidityBNB.notEqual(BIGDECIMAL_ZERO)) {
      let daiWeight = daiPair._reserve1.div(totalLiquidityBNB);
      let busdWeight = busdPair._reserve0.div(totalLiquidityBNB);
      let usdtWeight = usdtPair._reserve1.div(totalLiquidityBNB);
      return daiPair._token0Price
        .times(daiWeight)
        .plus(busdPair._token1Price.times(busdWeight))
        .plus(usdtPair._token0Price.times(usdtWeight));
    }
    return BIGDECIMAL_ZERO;
    // busd and usdt have been created
  } else if (busdPair !== null && usdtPair !== null) {
    let totalLiquidityBNB = busdPair._reserve0.plus(usdtPair._reserve1);
    if (totalLiquidityBNB.notEqual(BIGDECIMAL_ZERO)) {
      let busdWeight = busdPair._reserve0.div(totalLiquidityBNB);
      let usdtWeight = usdtPair._reserve1.div(totalLiquidityBNB);
      return busdPair._token1Price.times(busdWeight).plus(usdtPair._token0Price.times(usdtWeight));
      // usdt is the only pair so far
    }
    return BIGDECIMAL_ZERO;
  } else if (busdPair !== null) {
    return busdPair._token1Price;
  } else if (usdtPair !== null) {
    return usdtPair._token0Price;
  } else {
    return BIGDECIMAL_ZERO;
  }
}
function wmaticPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdtPair = LiquidityPool.load(
    Address.fromString(POLYGON.WMATIC_USDT_PAIR).toHexString(), // usdt is token1
  ); // usdt is token0
  let usdcPair = LiquidityPool.load(
    Address.fromString(POLYGON.WMATIC_USDC_PAIR).toHexString(), // usdc is token1
  ); // busd is token1
  let daiPair = LiquidityPool.load(
    Address.fromString(POLYGON.WMATIC_DAI_PAIR).toHexString(), // dai is token1
  ); // dai is token1

  if (usdcPair !== null && usdtPair !== null && daiPair !== null) {
    let totalLiquidityBNB = daiPair._reserve0.plus(usdcPair._reserve0).plus(usdtPair._reserve0);
    if (totalLiquidityBNB.notEqual(BIGDECIMAL_ZERO)) {
      let daiWeight = daiPair._reserve0.div(totalLiquidityBNB);
      let usdcWeight = usdcPair._reserve0.div(totalLiquidityBNB);
      let usdtWeight = usdtPair._reserve0.div(totalLiquidityBNB);
      return daiPair._token1Price
        .times(daiWeight)
        .plus(usdcPair._token1Price.times(usdcWeight))
        .plus(usdtPair._token1Price.times(usdtWeight));
    }
    return BIGDECIMAL_ZERO;
    // busd and usdt have been created
  } else if (usdcPair !== null && usdtPair !== null) {
    let totalLiquidityBNB = usdcPair._reserve0.plus(usdtPair._reserve0);
    if (totalLiquidityBNB.notEqual(BIGDECIMAL_ZERO)) {
      let usdcWeight = usdcPair._reserve0.div(totalLiquidityBNB);
      let usdtWeight = usdtPair._reserve0.div(totalLiquidityBNB);
      return usdcPair._token1Price.times(usdcWeight).plus(usdtPair._token1Price.times(usdtWeight));
      // usdt is the only pair so far
    }
    return BIGDECIMAL_ZERO;
  } else if (usdcPair !== null) {
    return usdcPair._token1Price;
  } else if (usdtPair !== null) {
    return usdtPair._token1Price;
  } else {
    return BIGDECIMAL_ZERO;
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = dataSource.network() == Network.BSC.toLowerCase() ? BSC.WHITELIST : POLYGON.WHITELIST;

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
// let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigInt.fromI32(10000);

// minimum liquidity for price to get tracked
// let MINIMUM_LIQUIDITY_THRESHOLD_BNB = BigDecimal.fromString('1');

export function findBnbPerToken(token: Token): BigDecimal {
  if (token.id == Address.fromString(WRAPPED_NATIVE_TOKEN_ADDRESS).toHexString()) {
    return BIGDECIMAL_ONE;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]));
    if (pairAddress.toHex() != ZERO_ADDRESS) {
      let pool = LiquidityPool.load(pairAddress.toHexString());
      if (pool !== null) {
        if (pool._token0 == token.id) {
          let token1 = getOrCreateToken(Address.fromString(pool._token1));
          return pool._token1Price.times(token1._derivedBNB as BigDecimal); // return token1 per our token * BNB per token 1
        }
        if (pool._token1 == token.id) {
          let token0 = getOrCreateToken(Address.fromString(pool._token0));
          return pool._token0Price.times(token0._derivedBNB as BigDecimal); // return token0 per our token * BNB per token 0
        }
      }
    }
  }
  return BIGDECIMAL_ZERO; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
): BigDecimal {
  let helperStore = HelperStore.load("1")!;
  let price0 = token0._derivedBNB.times(helperStore._value);
  let price1 = token1._derivedBNB.times(helperStore._value);

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BigDecimal.fromString("2"));
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0);
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1);
  }

  // neither token is on white list, tracked volume is 0
  return BIGDECIMAL_ZERO;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
): BigDecimal {
  let helperStore = HelperStore.load("1");
  if (helperStore !== null) {
    let price0 = token0._derivedBNB.times(helperStore._value);
    let price1 = token1._derivedBNB.times(helperStore._value);

    // both are whitelist tokens, take average of both amounts
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
    }

    // take double value of the whitelisted token amount
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      return tokenAmount0.times(price0).times(BigDecimal.fromString("2"));
    }

    // take double value of the whitelisted token amount
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      return tokenAmount1.times(price1).times(BigDecimal.fromString("2"));
    }

    // neither token is on white list, tracked volume is 0
    return BIGDECIMAL_ZERO;
  }
  return BIGDECIMAL_ZERO;
}

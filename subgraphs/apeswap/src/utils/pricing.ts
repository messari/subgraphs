import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Bundle,
  LiquidityPool,
  Token,
} from "../../generated/schema";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  factoryContract,
  ZERO_ADDRESS,
} from "./constant";

const WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
const BUSD_WBNB_PAIR = "0x51e6d27fa57373d8d4c256231241053a70cb1d93"; // created block 4857769
const DAI_WBNB_PAIR = "0xf3010261b58b2874639ca2e860e9005e3be5de0b"; // created block 481116
const USDT_WBNB_PAIR = "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd"; // created block 648115

export function getBnbPriceInUSD(): BigInt {
  // fetch eth prices for each stablecoin
  let usdtPair = LiquidityPool.load(
    Address.fromString(USDT_WBNB_PAIR).toHexString()
  ); // usdt is token0
  let busdPair = LiquidityPool.load(
    Address.fromString(BUSD_WBNB_PAIR).toHexString()
  ); // busd is token1
  let daiPair = LiquidityPool.load(
    Address.fromString(DAI_WBNB_PAIR).toHexString()
  ); // dai is token1

  if (busdPair !== null && usdtPair !== null && daiPair !== null) {
    let totalLiquidityBNB = daiPair._reserve1
      .plus(busdPair._reserve0)
      .plus(usdtPair._reserve1);
    let daiWeight = daiPair._reserve1.div(totalLiquidityBNB);
    let busdWeight = busdPair._reserve0.div(totalLiquidityBNB);
    let usdtWeight = usdtPair._reserve1.div(totalLiquidityBNB);
    return daiPair._token0Price
      .times(daiWeight)
      .plus(busdPair._token1Price.times(busdWeight))
      .plus(usdtPair._token0Price.times(usdtWeight));
    // busd and usdt have been created
  } else if (busdPair !== null && usdtPair !== null) {
    let totalLiquidityBNB = busdPair._reserve0.plus(usdtPair._reserve1);
    let busdWeight = busdPair._reserve0.div(totalLiquidityBNB);
    let usdtWeight = usdtPair._reserve1.div(totalLiquidityBNB);
    return busdPair._token1Price
      .times(busdWeight)
      .plus(usdtPair._token0Price.times(usdtWeight));
    // usdt is the only pair so far
  } else if (busdPair !== null) {
    return busdPair._token1Price;
  } else if (usdtPair !== null) {
    return usdtPair._token0Price;
  } else {
    return BIGINT_ZERO;
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
  "0x55d398326f99059ff775485246999027b3197955", // USDT
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
  "0x23396cf899ca06c4472205fc903bdb4de249d6fc", // UST
  "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
  "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
  "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
  "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", // BANANA
];

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigInt.fromI32(10000);

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_BNB = BigInt.fromI32(1);

/**
 * Search through graph to find derived BNB per token.
 * @todo update to be derived BNB (add stablecoin estimates)
 **/
export function findBnbPerToken(token: Token): BigInt {
  if (token.id == Address.fromString(WBNB_ADDRESS).toHexString()) {
    return BIGINT_ONE;
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(
      Address.fromString(token.id),
      Address.fromString(WHITELIST[i])
    );
    if (pairAddress.toHex() != ZERO_ADDRESS) {
      let pool = LiquidityPool.load(pairAddress.toHexString());
      if (pool !== null) {
        if (
          pool._token0 == token.id &&
          pool._reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)
        ) {
          let token1 = Token.load(pool._token1);
          if (token1 !== null) {
            return pool._token1Price.times(token1.derivedBNB); // return token1 per our token * BNB per token 1
          }
        }
        if (
          pool._token1 == token.id &&
          pool._reserveBNB.gt(MINIMUM_LIQUIDITY_THRESHOLD_BNB)
        ) {
          let token0 = Token.load(pool._token0);
          if (token0 !== null) {
            return pool._token0Price.times(token0.derivedBNB); // return token0 per our token * BNB per token 0
          }
        }
      }
    }
  }
  return BIGINT_ZERO; // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigInt,
  token0: Token,
  tokenAmount1: BigInt,
  token1: Token,
  pool: LiquidityPool
): BigInt {
  let bundle = Bundle.load("1");
  if (bundle !== null) {
    let price0 = token0.derivedBNB.times(bundle.bnbPrice);
    let price1 = token1.derivedBNB.times(bundle.bnbPrice);

    // if less than 5 LPs, require high minimum reserve amount amount or return 0
    if (pool.liquidityProviderCount.lt(BigInt.fromI32(5))) {
      let reserve0USD = pool._reserve0.times(price0);
      let reserve1USD = pool._reserve1.times(price1);
      if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
        if (reserve0USD.plus(reserve1USD).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
          return BIGINT_ZERO;
        }
      }
      if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
        if (
          reserve0USD
            .times(BigInt.fromI32(2))
            .lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)
        ) {
          return BIGINT_ZERO;
        }
      }
      if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
        if (
          reserve1USD
            .times(BigInt.fromI32(2))
            .lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)
        ) {
          return BIGINT_ZERO;
        }
      }
    }

    // both are whitelist tokens, take average of both amounts
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      return tokenAmount0
        .times(price0)
        .plus(tokenAmount1.times(price1))
        .div(BigInt.fromI32(2));
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
    return BIGINT_ZERO;
  }
  return BIGINT_ZERO;
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigInt,
  token0: Token,
  tokenAmount1: BigInt,
  token1: Token
): BigInt {
  let bundle = Bundle.load("1");
  if (bundle !== null) {
    let price0 = token0.derivedBNB.times(bundle.bnbPrice);
    let price1 = token1.derivedBNB.times(bundle.bnbPrice);

    // both are whitelist tokens, take average of both amounts
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      return tokenAmount0.times(price0).plus(tokenAmount1.times(price1));
    }

    // take double value of the whitelisted token amount
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      return tokenAmount0.times(price0).times(BigInt.fromString("2"));
    }

    // take double value of the whitelisted token amount
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      return tokenAmount1.times(price1).times(BigInt.fromString("2"));
    }

    // neither token is on white list, tracked volume is 0
    return BIGINT_ZERO;
  }
  return BIGINT_ZERO;
}

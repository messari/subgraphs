import { BigDecimal, Address, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ZERO,
  ZERO_ADDRESS,
} from "../../../../../src/utils/constants";
import { UniswapV3Pool } from "../../../../../generated/templates/VariableDebtToken/UniswapV3Pool";
import { UniswapV3Factory } from "../../../../../generated/templates/Pool/UniswapV3Factory";

import { getPriceFallbackConfig } from "./config";

// from https://docs.uniswap.org/sdk/guides/fetching-prices#the-denominator
const Q96 = BigInt.fromI32(2).pow(96);
const Q192 = Q96.pow(2);

// getTokenUSDPrice will attempt to retrieve any token USD price from uniswapV3.
// tokenDecimals should be the token decimal multiplier, i.e.: 1_000_000_000 if 9 decimals.
export function getTokenUSDPrice(
  token: Address,
  tokenDecimals: BigDecimal
): BigDecimal {
  let config = getPriceFallbackConfig();
  if (!config) {
    return BIGDECIMAL_ZERO;
  }

  if (token.toHexString() == config.WETH_ADDRESS) {
    return getETHPriceUSD();
  }

  let wethPrice = getTokenWETHPrice(token, tokenDecimals);
  let wethUSD = getETHPriceUSD();

  return wethPrice.times(wethUSD);
}

// getTokenWETHPrice will return the price of a given token denominated in WETH.
// tokenDecimals should be the token decimal multiplier, i.e.: 1_000_000_000 if 9 decimals.
function getTokenWETHPrice(
  token: Address,
  tokenDecimals: BigDecimal
): BigDecimal {
  let config = getPriceFallbackConfig();
  if (!config) {
    return BIGDECIMAL_ZERO;
  }

  let factory = UniswapV3Factory.bind(
    Address.fromString(config.FACTORY_ADDRESS)
  );

  const fee005 = 500; // usually the pool with the most liquidity
  let poolAddr = factory.getPool(
    token,
    Address.fromString(config.WETH_ADDRESS),
    fee005
  );
  if (poolAddr.toHexString() == ZERO_ADDRESS) {
    return BIGDECIMAL_ZERO;
  }

  let pool = UniswapV3Pool.bind(poolAddr);
  return getTokenPriceFromPool(
    token.toHexString(),
    config.WETH_ADDRESS,
    pool,
    tokenDecimals,
    config.WETH_DECIMALS
  );
}

function getETHPriceUSD(): BigDecimal {
  let config = getPriceFallbackConfig();
  if (!config) {
    return BIGDECIMAL_ZERO;
  }

  let uniPool = UniswapV3Pool.bind(
    Address.fromString(config.USDC_WETH_POOL_ADDRESS)
  );

  return getTokenPriceFromPool(
    config.WETH_ADDRESS,
    config.USDC_ADDRESS,
    uniPool,
    config.WETH_DECIMALS,
    config.USDC_DECIMALS
  );
}

// getTokenPriceFromPool will calculate the price of `token` against `counterToken` from the info
// provided by the UniswapV3 pool.
// Details on how the price calculation works can be found here: https://docs.uniswap.org/sdk/guides/fetching-prices#understanding-sqrtprice
//
// `token` does not need to be token0. The function will determine which side of the pool the token
// takes, and calculate from there.
function getTokenPriceFromPool(
  token: string,
  counterToken: string,
  pool: UniswapV3Pool,
  tokenDecimals: BigDecimal,
  cTokenDecimals: BigDecimal
): BigDecimal {
  let token0 = token;
  let token1 = counterToken;
  let token0Decimals = tokenDecimals;
  let token1Decimals = cTokenDecimals;

  if (token0 > token1) {
    // https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Factory.sol#L41
    let tmp = token0;
    token0 = token1;
    token1 = tmp;
    let tmp2 = token0Decimals;
    token0Decimals = token1Decimals;
    token1Decimals = tmp2;
  }

  let sqrtRatioX96 = pool.slot0().value0.toBigDecimal();
  if (token0 == token) {
    let token0Price = sqrtRatioX96
      .times(sqrtRatioX96)
      .div(BigDecimal.fromString(Q192.toString()))
      .times(token0Decimals)
      .div(token1Decimals);

    return token0Price;
  }

  let token1Price = BigDecimal.fromString(Q192.toString())
    .div(sqrtRatioX96.times(sqrtRatioX96))
    .times(token1Decimals)
    .div(token0Decimals);

  return token1Price;
}

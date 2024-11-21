import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  QI92,
} from "../sdk/util/constants";

import { UniswapV3Pool } from "../../generated/StakedAvail/UniswapV3Pool";

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = BIGINT_ZERO; i.lt(decimals); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BIGDECIMAL_ONE);
  }
  return bd;
}

export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO;
  } else {
    return amount0.div(amount1);
  }
}
export function sqrtPriceX96ToTokenPrices(
  sqrtPriceX96: BigInt,
  token0Decimals: BigInt,
  token1Decimals: BigInt
): BigDecimal[] {
  const num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal();
  const denom = QI92;
  const price1 = num
    .div(denom)
    .times(exponentToBigDecimal(token0Decimals))
    .div(exponentToBigDecimal(token1Decimals));

  const price0 = safeDiv(BIGDECIMAL_ONE, price1);
  return [price0, price1];
}

export function getPriceForPair(address: Address): BigDecimal {
  let pricePair = BIGDECIMAL_ZERO;

  const uniswapPool = UniswapV3Pool.bind(address);
  const slot0 = uniswapPool.try_slot0();
  if (!slot0.reverted) {
    const sqrtPriceX96 = slot0.value.value0;
    const prices = sqrtPriceX96ToTokenPrices(
      sqrtPriceX96,
      BigInt.fromI32(DEFAULT_DECIMALS),
      BigInt.fromI32(DEFAULT_DECIMALS)
    );
    pricePair = prices[0];
  }

  return pricePair;
}

export function getAvailPrice(ethPriceUSD: BigDecimal): BigDecimal {
  const pair = Address.fromString("0x80f8143fa056a063aaeecec3323aa3426262ddb2"); // AVAIL/ETH
  const availPriceEth = getPriceForPair(pair);

  return availPriceEth.times(ethPriceUSD);
}

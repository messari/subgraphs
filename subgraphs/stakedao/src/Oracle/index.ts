import {
  Address,
  BigDecimal,
  BigInt,
  dataSource,
  log,
} from "@graphprotocol/graph-ts";

import * as constants from "./common/constants";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";

export function getUsdPricePerToken(tokenAddr: Address): BigDecimal[] {
  let network = dataSource.network();
  let decimals = BigInt.fromI32(10)
    .pow(BigInt.fromI32(6).toI32() as u8)
    .toBigDecimal();

  // ? 1. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (curvePrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[getCurvePriceUsdc] tokenAddress: {}, curvePrice: {}", [
      tokenAddr.toHexString(),
      curvePrice.div(decimals).toString(),
    ]);

    return [curvePrice, decimals];
  }

  //? 2. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (uniswapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[getPriceUsdcUniswap] tokenAddress: {}, uniswapPrice: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.div(decimals).toString(),
    ]);

    return [uniswapPrice, decimals];
  }

  //? 3. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (sushiswapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning(
      "[getPriceUsdcSushiswap] tokenAddress: {}, sushiswapPrice: {}",
      [tokenAddr.toHexString(), sushiswapPrice.div(decimals).toString()]
    );

    return [sushiswapPrice, decimals];
  }

  // TODO: WIP - ChainLink Router
  // //? 4. ChainLink
  // let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, netowrk);
  // if (chainLinkPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
  //   return [chainLinkPrice, BigInt.fromI32(8)];
  // }

  log.warning("Cannot Find Price For {}", [tokenAddr.toHexString()]);

  return [
    constants.BIGDECIMAL_ZERO,
    BigInt.fromI32(10)
      .pow(constants.BIGINT_ZERO.toI32() as u8)
      .toBigDecimal(),
  ];
}

export function getUsdPrice(tokenAddr: Address, amount: BigInt): BigDecimal {
  let usdPrice = getUsdPricePerToken(tokenAddr);

  if (usdPrice[0].notEqual(constants.BIGDECIMAL_ZERO)) {
    return usdPrice[0].times(amount.toBigDecimal()).div(usdPrice[1]);
  }

  return constants.BIGDECIMAL_ZERO;
}

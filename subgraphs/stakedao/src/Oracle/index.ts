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
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";

export function getUsdPricePerToken(tokenAddr: Address): BigDecimal[] {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return [
      constants.BIGDECIMAL_ZERO,
      constants.BIGINT_TEN
        .pow(constants.BIGINT_ZERO.toI32() as u8)
        .toBigDecimal(),
    ];
  }
  
  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN
    .pow(BigInt.fromI32(6).toI32() as u8)
    .toBigDecimal();

  // 1. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (yearnLensPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.div(decimals).toString(),
    ]);

    return [yearnLensPrice, decimals];
  }

  // 2. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (chainLinkPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.div(decimals).toString(),
    ]);

    return [chainLinkPrice, decimals];
  }

  // 3. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
  if (calculationsCurvePrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.div(decimals).toString(),
    ]);

    return [calculationsCurvePrice, decimals];
  }

  // 4. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
  if (calculationsSushiSwapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.div(decimals).toString(),
    ]);

    return [calculationsSushiSwapPrice, decimals];
  }

  // 5. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (curvePrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.div(decimals).toString(),
    ]);

    return [curvePrice, decimals];
  }

  // 6. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (uniswapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.div(decimals).toString(),
    ]);

    return [uniswapPrice, decimals];
  }

  // 7. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (sushiswapPrice.notEqual(constants.BIGDECIMAL_ZERO)) {
    log.warning(
      "[SushiSwapRouter] tokenAddress: {}, Price: {}",
      [tokenAddr.toHexString(), sushiswapPrice.div(decimals).toString()]
    );

    return [sushiswapPrice, decimals];
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [tokenAddr.toHexString()]);

  return [
    constants.BIGDECIMAL_ZERO,
    constants.BIGINT_TEN
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

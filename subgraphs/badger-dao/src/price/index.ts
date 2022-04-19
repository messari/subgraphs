import { Address, BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  let skip = [
    Address.fromString("0x3472a5a71965499acd81997a54bba8d852c6e53d"),
    Address.fromString("0xcd7989894bc033581532d2cd88da5db0a4b12859"), //buniWbtcBadger
  ];

  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  if (skip.includes(tokenAddr)) {
    log.warning("[Oracle] skipping", []);
    return new CustomPriceType();
  }

  log.warning("[Oracle] finding price of token {}", [tokenAddr.toHex()]);
  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();

  // 5. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(curvePrice.usdPrice, BigInt.fromI32(6));
  }

  // 7. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
  }

  // 1. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(yearnLensPrice.usdPrice, BigInt.fromI32(6));
  }

  // 6. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(uniswapPrice.usdPrice, BigInt.fromI32(6));
  }

  // 2. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(chainLinkPrice.usdPrice, BigInt.fromI32(6));
  }

  // 3. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
  if (!calculationsCurvePrice.reverted) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsCurvePrice.usdPrice, BigInt.fromI32(6));
  }

  // 4. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
  if (!calculationsSushiSwapPrice.reverted) {
    log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsSushiSwapPrice.usdPrice, BigInt.fromI32(6));
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [tokenAddr.toHexString()]);

  return new CustomPriceType();
}

export function getUsdPrice(tokenAddr: Address, amount: BigInt): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice
      .times(amount.toBigDecimal())
      .div(tokenPrice.decimals.toBigDecimal())
      .div(constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal());
  }

  return constants.BIGDECIMAL_ZERO;
}

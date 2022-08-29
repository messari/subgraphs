import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import {
  log,
  Address,
  BigDecimal,
  dataSource,
  BigInt,
} from "@graphprotocol/graph-ts";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { getTokenPriceFromUniswapV1 } from "./oracles/UniswapV1";
import { Network } from "../common/constants";

export function getUsdPricePerToken(
  tokenAddr: Address,
  blockNumber: BigInt
): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  if (
    network.toUpperCase() == Network.MAINNET &&
    blockNumber < BigInt.fromI32(10207858)
  ) {
    let uniswapV1Price = getTokenPriceFromUniswapV1(tokenAddr, network);
    if (!uniswapV1Price.reverted) {
      log.warning("[UniswapV1Oracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        uniswapV1Price.usdPrice.div(uniswapV1Price.decimalsBaseTen).toString(),
      ]);
      return uniswapV1Price;
    }
    log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
      tokenAddr.toHexString(),
    ]);

    return new CustomPriceType();
  }

  // 1. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString(),
    ]);
    return uniswapPrice;
  }

  // 2. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString(),
    ]);
    return yearnLensPrice;
  }

  // 3. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString(),
    ]);
    return chainLinkPrice;
  }

  // 4. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(
    tokenAddr,
    network
  );
  if (!calculationsCurvePrice.reverted) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice
        .div(calculationsCurvePrice.decimalsBaseTen)
        .toString(),
    ]);
    return calculationsCurvePrice;
  }

  // 5. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(
    tokenAddr,
    network
  );
  if (!calculationsSushiSwapPrice.reverted) {
    log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice
        .div(calculationsSushiSwapPrice.decimalsBaseTen)
        .toString(),
    ]);
    return calculationsSushiSwapPrice;
  }

  // 6. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString(),
    ]);
    return curvePrice;
  }

  // 7. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
    ]);
    return sushiswapPrice;
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal,
  blockNumber: BigInt
): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr, blockNumber);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}

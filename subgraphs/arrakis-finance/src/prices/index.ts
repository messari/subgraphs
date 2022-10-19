import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromOneInch } from "./oracles/1InchOracle";
import { getTokenPriceFromAaveOracle } from "./oracles/AaveOracle";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { log, Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { PriceSource } from "../common/constants";

export function getUsdPricePerToken(
  tokenAddr: Address,
  skipSources: Array<string> = []
): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  const network = dataSource.network();

  // 1. Yearn Lens Oracle
  if (!skipSources.includes(PriceSource.YEARN)) {
    const yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
    if (!yearnLensPrice.reverted) {
      log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        yearnLensPrice.usdPrice.div(yearnLensPrice.decimalsBaseTen).toString(),
      ]);
      return yearnLensPrice;
    }
  }

  // 2. ChainLink Feed Registry
  if (!skipSources.includes(PriceSource.CHAINLINK)) {
    const chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
    if (!chainLinkPrice.reverted) {
      log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        chainLinkPrice.usdPrice.div(chainLinkPrice.decimalsBaseTen).toString(),
      ]);
      return chainLinkPrice;
    }
  }

  // 3. CalculationsCurve
  if (!skipSources.includes(PriceSource.CURVE_CALC)) {
    const calculationsCurvePrice = getTokenPriceFromCalculationCurve(
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
  }

  // 4. CalculationsSushiSwap
  if (!skipSources.includes(PriceSource.SUSHISWAP_CALC)) {
    const calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(
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
  }

  // 5. One Inch Oracle
  if (!skipSources.includes(PriceSource.ONE_INCH)) {
    const oneInchOraclePrice = getTokenPriceFromOneInch(tokenAddr, network);
    if (!oneInchOraclePrice.reverted) {
      log.warning("[OneInchOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        oneInchOraclePrice.usdPrice
          .div(oneInchOraclePrice.decimalsBaseTen)
          .toString(),
      ]);
      return oneInchOraclePrice;
    }
  }

  // 6. Yearn Lens Oracle
  if (!skipSources.includes(PriceSource.AAVE)) {
    const aaveOraclePrice = getTokenPriceFromAaveOracle(tokenAddr, network);
    if (!aaveOraclePrice.reverted) {
      log.warning("[AaveOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        aaveOraclePrice.usdPrice
          .div(aaveOraclePrice.decimalsBaseTen)
          .toString(),
      ]);
      return aaveOraclePrice;
    }
  }

  // 7. Curve Router
  if (!skipSources.includes(PriceSource.CURVE_ROUTER)) {
    const curvePrice = getCurvePriceUsdc(tokenAddr, network);
    if (!curvePrice.reverted) {
      log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        curvePrice.usdPrice.div(curvePrice.decimalsBaseTen).toString(),
      ]);
      return curvePrice;
    }
  }

  // 6. Uniswap Router
  if (!skipSources.includes(PriceSource.UNISWAP_ROUTER)) {
    const uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
    if (!uniswapPrice.reverted) {
      log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        uniswapPrice.usdPrice.div(uniswapPrice.decimalsBaseTen).toString(),
      ]);
      return uniswapPrice;
    }
  }

  // 7. SushiSwap Router
  if (!skipSources.includes(PriceSource.SUSHISWAP_ROUTER)) {
    const sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
    if (!sushiswapPrice.reverted) {
      log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
      ]);
      return sushiswapPrice;
    }
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(
  tokenAddr: Address,
  amount: BigDecimal
): BigDecimal {
  const tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  return constants.BIGDECIMAL_ZERO;
}

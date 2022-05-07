import { Address, BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts";

import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import {
  getTokenPriceFromCalculationCurve,
  getTokenPriceFromCalculationCurveReplacements,
} from "./calculations/CalculationsCurve";
import { getTokenPriceFromCalculationYearn, getTokenPriceFromCalculationYearnV1 } from "./calculations/CalculationsYearn";
import { getTokenPriceFromCalculationAave } from "./calculations/CalculationsAAVE";
import { getTokenPriceFromCalculationCompound } from "./calculations/CalculationsCompound";
import { isStableCoin } from "./common/utils";
import { getOrCreateToken } from "../common/getters";
import { BIGDECIMAL_ONE } from "../common/constants";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  log.warning('getUsdPricePerToken function',[])
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  
  // 1. Stablecoin
  if (isStableCoin(tokenAddr, network)) {
    log.warning("[isStableCoin] tokenAddress: {}, Price: {}", [tokenAddr.toHexString(), BIGDECIMAL_ONE.toString()])
    return CustomPriceType.initialize(BIGDECIMAL_ONE,BigInt.fromI32(getOrCreateToken(tokenAddr).decimals));
  }

  // 2. Yearn Lens Oracle
  let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
  if (!yearnLensPrice.reverted) {
    log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      yearnLensPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(yearnLensPrice.usdPrice, BigInt.fromI32(6));
  }

  // 3. ChainLink Feed Registry
  let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
  if (!chainLinkPrice.reverted) {
    log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      chainLinkPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(chainLinkPrice.usdPrice, BigInt.fromI32(6));
  }

  // 4. CalculationsCurve
  let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
  if (!calculationsCurvePrice.reverted) {
    log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurvePrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsCurvePrice.usdPrice, BigInt.fromI32(6));
  }

  // 5. CalculationsSushiSwap
  let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
  if (!calculationsSushiSwapPrice.reverted) {
    log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsSushiSwapPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsSushiSwapPrice.usdPrice, BigInt.fromI32(6));
  }

  // 6. Curve Router
  let curvePrice = getCurvePriceUsdc(tokenAddr, network);
  if (!curvePrice.reverted) {
    log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      curvePrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(curvePrice.usdPrice, BigInt.fromI32(6));
  }

  // 7. Uniswap Router
  let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
  if (!uniswapPrice.reverted) {
    log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      uniswapPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(uniswapPrice.usdPrice, BigInt.fromI32(6));
  }

  // 8. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
  }

  // 9. calculationsYearn
  let calculationsYearnPrice = getTokenPriceFromCalculationYearn(tokenAddr, network);
  if (!calculationsYearnPrice.reverted) {
    log.warning("[CalculationsYearn] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsYearnPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsYearnPrice.usdPrice, BigInt.fromI32(6));
  }

  // 10. calculationsAave
  let calculationsAavePrice = getTokenPriceFromCalculationAave(tokenAddr, network);
  if (!calculationsAavePrice.reverted) {
    log.warning("[CalculationsAave] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsAavePrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsAavePrice.usdPrice, BigInt.fromI32(6));
  }

  // 11. calculationsCurveReplacement
  let calculationsCurveReplacementPrice = getTokenPriceFromCalculationCurveReplacements(tokenAddr, network);
  if (!calculationsCurveReplacementPrice.reverted) {
    log.warning("[CalculationsCurveReplacement] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCurveReplacementPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsCurveReplacementPrice.usdPrice, BigInt.fromI32(6));
  }

  // 12. calculationsCompound
  let calculationsCompoundPrice = getTokenPriceFromCalculationCompound(tokenAddr, network);
  if (!calculationsCompoundPrice.reverted) {
    log.warning("[calculationsCompoundPrice] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsCompoundPrice.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsCompoundPrice.usdPrice, BigInt.fromI32(6));
  }

  // 13. calculationsYearnV1
  let calculationsYearnV1 = getTokenPriceFromCalculationYearnV1(tokenAddr, network);
  if (!calculationsYearnV1.reverted) {
    log.warning("[calculationsYearnV1] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      calculationsYearnV1.usdPrice.div(constants.usd_decimals).toString(),
    ]);
    return CustomPriceType.initialize(calculationsYearnV1.usdPrice, BigInt.fromI32(6));
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

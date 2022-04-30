import { Address, BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts";

import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getPriceUsdc as getPriceUsdcUniswap } from "./routers/UniswapRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";

export function getUsdPricePerToken(tokenAddr: Address, blockNumber: i32): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();

  // 1. Yearn Lens Oracle
  if (blockNumber >= 12242339) {
    let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
    if (!yearnLensPrice.reverted) {
      log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        yearnLensPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(yearnLensPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 2. ChainLink Feed Registry
  if (blockNumber >= 12864088) {
    let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
    if (!chainLinkPrice.reverted) {
      log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        chainLinkPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(chainLinkPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 3. CalculationsCurve
  if (blockNumber >= 12370088) {
    let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
    if (!calculationsCurvePrice.reverted) {
      log.warning("[CalculationsCurve] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        calculationsCurvePrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(calculationsCurvePrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 4. CalculationsSushiSwap
  if (blockNumber >= 12692284) {
    let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
    if (!calculationsSushiSwapPrice.reverted) {
      log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        calculationsSushiSwapPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(calculationsSushiSwapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 5. Curve Router
  if (blockNumber >= 11154794) {
    let curvePrice = getCurvePriceUsdc(tokenAddr, network);
    if (!curvePrice.reverted) {
      log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        curvePrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(curvePrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 6. Uniswap Router
  if (blockNumber >= 10207858) {
    let uniswapPrice = getPriceUsdcUniswap(tokenAddr, network);
    if (!uniswapPrice.reverted) {
      log.warning("[UniswapRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        uniswapPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(uniswapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 7. SushiSwap Router
  if (blockNumber >= 10794261) {
    let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
    if (!sushiswapPrice.reverted) {
      log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        sushiswapPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [tokenAddr.toHexString()]);

  return new CustomPriceType();
}

export function getUsdPrice(tokenAddr: Address, amount: BigInt, blockNumber: i32): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr, blockNumber);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice
      .times(amount.toBigDecimal())
      .div(tokenPrice.decimals.toBigDecimal())
      .div(constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal());
  }

  return constants.BIGDECIMAL_ZERO;
}

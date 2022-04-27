import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from "@graphprotocol/graph-ts";
import {
  CHAINLINK_CUSTOM_TOKENS,
  CURVE_ROUTER_TOKENS,
  RouterType,
  SUSHI_ROUTER_TOKENS,
} from "../constant";
import { getTokenPriceFromCalculationCurve } from "./calculations/CalculationsCurve";
import { getTokenPriceFromSushiSwap } from "./calculations/CalculationsSushiswap";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getUsdPriceOfBadgerWbtcToken } from "./custom/BadgerWbtc";
import { getTokenPriceFromChainLink } from "./oracles/ChainLinkFeed";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";

function getRouterTypeForToken(tokenAddress: Address): string {
  if (SUSHI_ROUTER_TOKENS.includes(tokenAddress)) return RouterType.SUSHI_ROUTER;
  if (CURVE_ROUTER_TOKENS.includes(tokenAddress)) return RouterType.CURVE_ROUTER;
  if (CHAINLINK_CUSTOM_TOKENS.includes(tokenAddress)) return RouterType.CHAINLINK_CUSTOM;
  return RouterType.YEARN_ROUTER;
}

export function getUsdPricePerToken(tokenAddr: Address, block: ethereum.Block): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();
  let routerToUse = getRouterTypeForToken(tokenAddr);

  // 2. ChainLink Feed Registry
  if (block.number.ge(BigInt.fromString("12864088"))) {
    let chainLinkPrice = getTokenPriceFromChainLink(tokenAddr, network);
    if (!chainLinkPrice.reverted) {
      log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        chainLinkPrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(chainLinkPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 3. CalculationsCurve
  if (block.number.ge(BigInt.fromString("12370088"))) {
    let calculationsCurvePrice = getTokenPriceFromCalculationCurve(tokenAddr, network);
    if (!calculationsCurvePrice.reverted) {
      log.warning("[CalculationsCurve] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        calculationsCurvePrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(calculationsCurvePrice.usdPrice, BigInt.fromI32(6));
    }
  }

  // 4. CalculationsSushiSwap
  if (block.number.ge(BigInt.fromString("12692284"))) {
    let calculationsSushiSwapPrice = getTokenPriceFromSushiSwap(tokenAddr, network);
    if (!calculationsSushiSwapPrice.reverted) {
      log.warning("[CalculationsSushiSwap] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        calculationsSushiSwapPrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(calculationsSushiSwapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.CURVE_ROUTER) {
    let curvePrice = getCurvePriceUsdc(tokenAddr, network);
    if (!curvePrice.reverted) {
      log.warning("[CurveRouter] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        curvePrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(curvePrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.SUSHI_ROUTER) {
    let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
    if (!sushiswapPrice.reverted) {
      log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        sushiswapPrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.YEARN_ROUTER) {
    let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
    if (!yearnLensPrice.reverted) {
      log.warning("[YearnLensOracle] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        yearnLensPrice.usdPrice.div(decimals).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(yearnLensPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.CHAINLINK_CUSTOM) {
    let chainLinkPrice = getUsdPriceOfBadgerWbtcToken(tokenAddr);
    if (!chainLinkPrice.reverted) {
      log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {} Block: {}", [
        tokenAddr.toHexString(),
        chainLinkPrice.usdPrice.div(chainLinkPrice.decimals.toBigDecimal()).toString(),
        block.number.toString(),
      ]);
      return CustomPriceType.initialize(chainLinkPrice.usdPrice, constants.BIGINT_ZERO);
    }
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {} block: {}", [
    tokenAddr.toHexString(),
    block.number.toString(),
  ]);

  return new CustomPriceType();
}

export function getUsdPrice(tokenAddr: Address, amount: BigInt, block: ethereum.Block): BigDecimal {
  let tokenPrice = getUsdPricePerToken(tokenAddr, block);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice
      .times(amount.toBigDecimal())
      .div(tokenPrice.decimals.toBigDecimal())
      .div(constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal());
  }

  return constants.BIGDECIMAL_ZERO;
}

import { Address, BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts";
import {
  BIGINT_ZERO,
  CHAINLINK_CUSTOM_TOKENS,
  CURVE_ROUTER_TOKENS,
  RouterType,
  SUSHI_ROUTER_TOKENS,
} from "../constant";
import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { getUsdPriceOfBadgerWbtcToken } from "./custom/BadgerWbtc";
import { getTokenPriceFromYearnLens } from "./oracles/YearnLensOracle";
import { getCurvePriceUsdc } from "./routers/CurveRouter";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";

function getRouterTypeForToken(tokenAddress: Address): string {
  if (SUSHI_ROUTER_TOKENS.includes(tokenAddress)) return RouterType.SUSHI_ROUTER;
  if (CURVE_ROUTER_TOKENS.includes(tokenAddress)) return RouterType.CURVE_ROUTER;
  if (CHAINLINK_CUSTOM_TOKENS.includes(tokenAddress)) return RouterType.CHAINLINK_CUSTOM;
  return RouterType.YEARN_ROUTER;
}

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();
  let routerToUse = getRouterTypeForToken(tokenAddr);

  if (routerToUse == RouterType.CURVE_ROUTER) {
    let curvePrice = getCurvePriceUsdc(tokenAddr, network);
    if (!curvePrice.reverted) {
      log.warning("[CurveRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        curvePrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(curvePrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.SUSHI_ROUTER) {
    let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
    if (!sushiswapPrice.reverted) {
      log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        sushiswapPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.YEARN_ROUTER) {
    let yearnLensPrice = getTokenPriceFromYearnLens(tokenAddr, network);
    if (!yearnLensPrice.reverted) {
      log.warning("[YearnLensOracle] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        yearnLensPrice.usdPrice.div(decimals).toString(),
      ]);
      return CustomPriceType.initialize(yearnLensPrice.usdPrice, BigInt.fromI32(6));
    }
  }

  if (routerToUse == RouterType.CHAINLINK_CUSTOM) {
    let chainLinkPrice = getUsdPriceOfBadgerWbtcToken(tokenAddr);
    if (!chainLinkPrice.reverted) {
      log.warning("[ChainLinkFeed] tokenAddress: {}, Price: {}", [
        tokenAddr.toHexString(),
        chainLinkPrice.usdPrice.div(chainLinkPrice.decimals.toBigDecimal()).toString(),
      ]);
      return CustomPriceType.initialize(chainLinkPrice.usdPrice, BIGINT_ZERO);
    }
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

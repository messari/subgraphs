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

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  let network = dataSource.network();
  let decimals = constants.BIGINT_TEN.pow(BigInt.fromI32(6).toI32() as u8).toBigDecimal();

  // 3. SushiSwap Router
  let sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(decimals).toString(),
    ]);
    return CustomPriceType.initialize(sushiswapPrice.usdPrice, BigInt.fromI32(6));
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

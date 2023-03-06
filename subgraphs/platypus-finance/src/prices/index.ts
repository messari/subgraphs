import * as constants from "./common/constants";
import { CustomPriceType } from "./common/types";
import { log, Address, BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { getPriceUsdc as getPriceUsdcSushiswap } from "./routers/SushiSwapRouter";
import { getPriceUsdc as getPriceUsdcTraderJoe } from "./routers/TraderJoeRouter";

export function getUsdPricePerToken(tokenAddr: Address): CustomPriceType {
  // Check if tokenAddr is a NULL Address
  if (tokenAddr.toHex() == constants.ZERO_ADDRESS_STRING) {
    return new CustomPriceType();
  }

  const network = dataSource.network();

  // TraderJoe Router
  const traderJoePrice = getPriceUsdcTraderJoe(tokenAddr, network);
  if (!traderJoePrice.reverted) {
    log.warning("[TraderJoeRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      traderJoePrice.usdPrice.div(traderJoePrice.decimalsBaseTen).toString(),
    ]);
    return traderJoePrice;
  }
  log.warning("[Oracle] Failed to Fetch Price with TraderJoe will try sushiswap next, tokenAddr: {}", [
    tokenAddr.toHexString(),
  ]);

  // 7. SushiSwap Router
  const sushiswapPrice = getPriceUsdcSushiswap(tokenAddr, network);
  if (!sushiswapPrice.reverted) {
    log.warning("[SushiSwapRouter] tokenAddress: {}, Price: {}", [
      tokenAddr.toHexString(),
      sushiswapPrice.usdPrice.div(sushiswapPrice.decimalsBaseTen).toString(),
    ]);
    return sushiswapPrice;
  }

  return new CustomPriceType();
}

export function getUsdPrice(tokenAddr: Address, amount: BigDecimal): BigDecimal {
  const tokenPrice = getUsdPricePerToken(tokenAddr);

  if (!tokenPrice.reverted) {
    return tokenPrice.usdPrice.times(amount).div(tokenPrice.decimalsBaseTen);
  }

  log.warning("[Oracle] Failed to Fetch Price, tokenAddr: {}", [tokenAddr.toHexString()]);
  return constants.BIGDECIMAL_ZERO;
}

import { COMPTROLLER_ADDRESS, BIGDECIMAL_ZERO, CREAM_COMPTROLLER_ADDRESS } from "../../common/utils/constants";
import { Market } from "../../../generated/schema";
import { BigDecimal } from "@graphprotocol/graph-ts";
import { getUSDPriceOfToken as getUSDPriceOfTokenCompound } from "./compound/prices";
import { getUSDPriceOfToken as getUSDPriceOfTokenCream } from "./cream/prices";

// returns the token price
export function getUSDPriceOfToken(market: Market, blockNumber: i32, protocolAddress: string): BigDecimal {
  let tokenPrice = BIGDECIMAL_ZERO;

  if (protocolAddress.toLowerCase() == COMPTROLLER_ADDRESS.toLowerCase()) {
    tokenPrice = getUSDPriceOfTokenCompound(market, blockNumber);
  } else if (protocolAddress.toLowerCase() == CREAM_COMPTROLLER_ADDRESS.toLowerCase()) {
    tokenPrice = getUSDPriceOfTokenCream(market, blockNumber);
  }

  return tokenPrice;
}

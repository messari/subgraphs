import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { DEFAULT_DECIMALS } from "../constant";

export function getPriceOfStakeToken(inputTokenPrice: BigDecimal, pricePerShare: BigInt): BigDecimal {
  return pricePerShare
    .toBigDecimal()
    .div(BigDecimal.fromString(DEFAULT_DECIMALS.toString()))
    .times(inputTokenPrice);
}

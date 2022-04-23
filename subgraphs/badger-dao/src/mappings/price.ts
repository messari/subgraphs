import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_TEN, DEFAULT_DECIMALS } from "../constant";

export function getPriceOfStakeToken(
  inputTokenPrice: BigDecimal,
  pricePerShare: BigInt,
): BigDecimal {
  let decimals = BIGINT_TEN.pow(DEFAULT_DECIMALS as u8);

  return pricePerShare
    .toBigDecimal()
    .div(decimals.toBigDecimal())
    .times(inputTokenPrice);
}

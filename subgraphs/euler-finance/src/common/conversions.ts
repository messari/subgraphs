import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, DECIMAL_PRECISION } from "./constants";

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001';
}

export function amountToUsd(amount: BigInt, twap: BigInt, twapPrice: BigDecimal): BigDecimal {
  if (twapPrice == BIGDECIMAL_ZERO) return BIGDECIMAL_ZERO;

  const twapD = twap.toBigDecimal();
  const divisor = BigDecimal.fromString('1e18');

  const assetAmount = amount.toBigDecimal();
  const wethPrice = twapD.div(twapPrice);
  const wethPerAsset = twapD.div(divisor);

  return assetAmount.times(wethPrice).times(wethPerAsset).div(DECIMAL_PRECISION);
}

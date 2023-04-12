import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TEN,
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  DEFAULT_DECIMALS,
} from "./constants";

import { BIGDECIMAL_ZERO } from "./constants";

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = DEFAULT_DECIMALS
): BigDecimal {
  return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

export function bigDecimalToBigInt(input: BigDecimal): BigInt {
  const str = input.truncate(0).toString();
  return BigInt.fromString(str);
}

// returns 10^exp
export function exponentToBigDecimal(exp: i32 = DEFAULT_DECIMALS): BigDecimal {
  let bd = BIGDECIMAL_ONE;
  for (let i = 0; i < exp; i++) {
    bd = bd.times(BIGDECIMAL_TEN);
  }
  return bd;
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BIGDECIMAL_ZERO;
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(
    BigDecimal.fromString(BigInt.fromI32(prices.length).toString())
  );
}

export function calculateMedian(prices: BigDecimal[]): BigDecimal {
  const sorted = prices.sort((a, b) => {
    return a.equals(b) ? 0 : a.gt(b) ? 1 : -1;
  });

  const mid = Math.ceil(sorted.length / 2) as i32;
  if (sorted.length % 2 == 0) {
    return sorted[mid].plus(sorted[mid - 1]).div(BigDecimal.fromString("2"));
  }

  return sorted[mid - 1];
}

export function safeDivide(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b == BIGDECIMAL_ZERO) return BIGDECIMAL_ZERO;

  return a.div(b);
}

import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, BIGINT_ONE } from "../constants";

export function bigIntToBigDecimal(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
}

// n => 10^n
export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let result = BIGINT_ONE;
  let ten = BigInt.fromI32(10);
  for (let i = 0; i < decimals; i++) {
    result = result.times(ten);
  }
  return result.toBigDecimal();
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
  for (let i = 0; i < prices.length; i++) {
    sum = sum.plus(prices[i]);
  }

  return sum.div(BigDecimal.fromString(BigInt.fromI32(prices.length).toString()));
}

export function calculateMedian(prices: BigDecimal[]): BigDecimal {
  let sorted = prices.sort((a, b) => {
    return a.equals(b) ? 0 : a.gt(b) ? 1 : -1;
  });

  let mid = Math.ceil(sorted.length / 2) as i32;
  if (sorted.length % 2 == 0) {
    return sorted[mid].plus(sorted[mid - 1]).div(BigDecimal.fromString("2"));
  }

  return sorted[mid - 1];
}

export function divBigDecimal(numerator: BigDecimal, denominator: BigDecimal): BigDecimal {
  if (denominator.equals(BIGDECIMAL_ZERO)) {
    return BigDecimal.fromString("0");
  }
  return numerator.div(denominator);
}

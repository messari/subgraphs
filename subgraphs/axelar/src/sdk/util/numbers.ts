import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_TWO, DEFAULT_DECIMALS } from "./constants";

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = DEFAULT_DECIMALS
): BigDecimal {
  const BASE_TEN = 10;
  return quantity.divDecimal(
    BigInt.fromI32(BASE_TEN as i32)
      .pow(decimals as u8)
      .toBigDecimal()
  );
}

export function bigDecimalToBigInt(input: BigDecimal): BigInt {
  const str = input.truncate(0).toString();
  return BigInt.fromString(str);
}

// returns 10^exp
export function exponentToBigDecimal(exp: i32 | null = null): BigDecimal {
  const DEFAULT_DECIMALS = 18;
  if (!exp) {
    exp = DEFAULT_DECIMALS;
  }
  let bd = BigDecimal.fromString("1");
  const ten = BigDecimal.fromString("10");
  for (let i = 0; i < exp; i++) {
    bd = bd.times(ten);
  }
  return bd;
}

export function calculateAverage(prices: BigDecimal[]): BigDecimal {
  let sum = BigDecimal.fromString("0");
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
    return sorted[mid].plus(sorted[mid - 1]).div(BIGDECIMAL_TWO);
  }

  return sorted[mid - 1];
}

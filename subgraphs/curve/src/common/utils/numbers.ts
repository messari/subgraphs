import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO } from "../../prices/common/constants";
import { BIGINT_ZERO } from "../constants";

export function bigIntToBigDecimal(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
}

// returns 10^exp
export function exponentToBigDecimal(exp: i32): BigDecimal {
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

export function divBigInt(a: BigInt, b: BigInt): BigInt {
  if (b.equals(BIGINT_ZERO)) {
    return BIGINT_ZERO
  }
  return a.div(b);
}

export function divBigDecimal(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b.equals(BIGDECIMAL_ZERO)) {
    return BIGDECIMAL_ZERO
  }
  return a.div(b);
}
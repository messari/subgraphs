import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ONE, BIGINT_TWO, BIGINT_ZERO } from "../constants";

export function bigIntToBigDecimal(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
}

// utilizes exponentiation by squaring: https://stackoverflow.com/a/34660211
// for all exp >= 0
export function powBigDecimal(base: BigDecimal, exp: BigInt): BigDecimal {
  if (exp.equals(BIGINT_ZERO)) {
    return BIGDECIMAL_ONE;
  }

  let temp = powBigDecimal(base, exp.div(BIGINT_TWO));

  if (exp.mod(BIGINT_TWO).equals(BIGINT_ZERO)) {
    return temp.times(temp);
  } else {
    return base.times(temp).times(temp);
  }
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

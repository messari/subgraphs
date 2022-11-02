import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_THREE,
  BIGDECIMAL_SIX,
  BIGDECIMAL_TWELVE,
  BIGDECIMAL_TWENTY_FOUR,
  BIGDECIMAL_FOUR,
} from "./constants";

export function isNullEthValue(value: string): boolean {
  return value == "0x0000000000000000000000000000000000000000000000000000000000000001";
}

export function bigDecimalExponential(rate: BigDecimal, exponent: BigDecimal): BigDecimal {
  // binomial expansion to obtain (1 + x)^n where x = rate, n = exponent
  // 1 + n*x + (n/2*(n-1))*x**2+(n/6*(n-1)*(n-2))*x**3+(n/24*(n-1)*(n-2)*(n-3))*x**4
  // + (n/120)*(n-1)*(n-2)*(n-3)*(n-4)*x**5
  // this is less precise, but more efficient than `powerBigDecimal` when power is big
  const firstTerm = exponent.times(rate);
  const secondTerm = exponent.div(BIGDECIMAL_TWO).times(exponent.minus(BIGDECIMAL_ONE)).times(rate.times(rate));
  const thirdTerm = exponent
    .div(BIGDECIMAL_SIX)
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(exponent.minus(BIGDECIMAL_ONE))
    .times(rate.times(rate).times(rate));
  const fourthTerm = exponent
    .div(BIGDECIMAL_TWENTY_FOUR)
    .times(exponent.minus(BIGDECIMAL_THREE))
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(exponent.minus(BIGDECIMAL_ONE))
    .times(rate.times(rate).times(rate).times(rate));
  const fifthTerm = exponent
    .div(BIGDECIMAL_TWELVE)
    .times(exponent.minus(BIGDECIMAL_FOUR))
    .times(exponent.minus(BIGDECIMAL_THREE))
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(exponent.minus(BIGDECIMAL_ONE))
    .times(rate.times(rate).times(rate).times(rate).times(rate));
  return BIGDECIMAL_ONE.plus(firstTerm).plus(secondTerm).plus(thirdTerm).plus(fourthTerm).plus(fifthTerm);
}

//convert BigDecimal to BigInt by truncating the decimal places
export function BigDecimalTruncateToBigInt(x: BigDecimal): BigInt {
  return BigInt.fromString(x.truncate(0).toString());
}

//change number of decimals for BigInt
export function bigIntChangeDecimals(x: BigInt, from: i32, to: i32): BigInt {
  let result = x;

  if (to == from) {
    return result;
  } else if (to > from) {
    // increase number of decimals
    const diffMagnitude = BigInt.fromI32(10).pow((to - from) as u8);
    result = x.times(diffMagnitude);
  } else if (to < from) {
    // decrease number of decimals
    const diffMagnitude = BigInt.fromI32(10)
      .pow((from - to) as u8)
      .toBigDecimal();
    const xBD = x.divDecimal(diffMagnitude);
    result = BigDecimalTruncateToBigInt(xBD);
  }

  return result;
}

export function bigIntToBDUseDecimals(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
}

// return true if |x1 - x2| < precision
export function aboutEqual(x1: BigInt, x2: BigInt, preicision: BigInt): bool {
  if (x1.ge(x2)) {
    return x1.minus(x2).le(preicision);
  } else {
    return x2.minus(x1).le(preicision);
  }
  return false;
}

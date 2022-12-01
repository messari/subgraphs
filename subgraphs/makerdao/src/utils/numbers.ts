import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGDECIMAL_TWO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_SIX,
  BIGDECIMAL_TWELVE,
  BIGDECIMAL_THREE,
} from "../common/constants";

export function bigIntToBDUseDecimals(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
}

export function bigDecimalExponential(rate: BigDecimal, exponent: BigDecimal): BigDecimal {
  // binomial expansion to obtain (1 + x)^n : (1 + rate)^exponent
  // 1 + n *x + (n/2*(n-1))*x**2+(n/6*(n-1)*(n-2))*x**3+(n/12*(n-1)*(n-2)*(n-3))*x**4
  // this is less precise, but more efficient than `powerBigDecimal` when power is big
  const firstTerm = exponent.times(rate);
  const secondTerm = exponent.div(BIGDECIMAL_TWO).times(exponent.minus(BIGDECIMAL_ONE)).times(rate.times(rate));
  const thirdTerm = exponent
    .div(BIGDECIMAL_SIX)
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(rate.times(rate).times(rate));
  const fourthTerm = exponent
    .div(BIGDECIMAL_TWELVE)
    .times(exponent.minus(BIGDECIMAL_THREE))
    .times(rate.times(rate).times(rate).times(rate));
  return firstTerm.plus(secondTerm).plus(thirdTerm).plus(fourthTerm);
}

// calculate the power of a BigDecimal (.pow() is not native to BigDecimal)
export function powerBigDecimal(base: BigDecimal, power: i32): BigDecimal {
  let product = base;
  for (let i = 0; i < power; i++) {
    product = product.times(base);
  }
  return product;
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

export function round(numberToRound: BigDecimal): BigDecimal {
  const parsedNumber: number = parseFloat(numberToRound.toString());
  const roundedNumber: number = Math.ceil((parsedNumber + Number.EPSILON) * 100) / 100;
  return BigDecimal.fromString(roundedNumber.toString());
}

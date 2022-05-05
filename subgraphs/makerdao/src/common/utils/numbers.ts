import { BigDecimal, BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  BIGINT_NEG_ONE,
  BIGDECIMAL_NEG_ONE,
  BIGDECIMAL_ZERO,
  ADDRESS_LENGTH,
  BIGINT_ZERO,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ONE,
  BIGDECIMAL_SIX,
  BIGDECIMAL_TWELVE,
  BIGDECIMAL_THREE,
  BIGDECIMAL_ONE_THOUSAND,
} from "../constants";

export function bigIntToBigDecimal(quantity: BigInt, decimals: i32 = 18): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal(),
  );
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

// calculate the power of a BigDecimal (.pow() is not native to BigDecimal)
export function powerBigDecimal(base: BigDecimal, power: i32): BigDecimal {
  let product = base;
  for (let i = 0; i < power; i++) {
    product = product.times(base);
  }
  return product;
}

export function bigDecimalExponential(rate: BigDecimal, exponent: BigDecimal): BigDecimal {
  // binomial expansion to obtain (1 + x)^n : (1 + rate)^exponent
  //1 + n *x + (n/2*(n-1))*x**2+(n/6*(n-1)*(n-2))*x**3+(n/12*(n-1)*(n-2)*(n-3))*x**4
  let firstTerm = exponent.times(rate);
  let secondTerm = exponent
    .div(BIGDECIMAL_TWO)
    .times(exponent.minus(BIGDECIMAL_ONE))
    .times(rate.times(rate));
  let thirdTerm = exponent
    .div(BIGDECIMAL_SIX)
    .times(exponent.minus(BIGDECIMAL_TWO))
    .times(rate.times(rate).times(rate));
  let fourthTerm = exponent
    .div(BIGDECIMAL_TWELVE)
    .times(exponent.minus(BIGDECIMAL_THREE))
    .times(
      rate
        .times(rate)
        .times(rate)
        .times(rate),
    );
  return firstTerm
    .plus(secondTerm)
    .plus(thirdTerm)
    .plus(fourthTerm);
}

export function bytesToUnsignedBigInt(value: Bytes, bigEndian: boolean = true): BigInt {
  return BigInt.fromUnsignedBytes(bigEndian ? Bytes.fromUint8Array(value.reverse()) : value);
}

export function bytesToSignedInt(value: Bytes, bigEndian: boolean = true): BigInt {
  return BigInt.fromSignedBytes(bigEndian ? Bytes.fromUint8Array(value.reverse()) : value);
}

export function bytesToAddress(address: Bytes): Address {
  return Address.fromHexString(address.toHexString()).subarray(-ADDRESS_LENGTH) as Address;
}

export function absValBigInt(value: BigInt): BigInt {
  if (value.lt(BIGINT_ZERO)) {
    return value.times(BIGINT_NEG_ONE);
  }
  return value;
}

export function absValBigDecimal(value: BigDecimal): BigDecimal {
  if (value.lt(BIGDECIMAL_ZERO)) {
    return value.times(BIGDECIMAL_NEG_ONE);
  }
  return value;
}

export function round(numberToRound: BigDecimal): BigDecimal {
  let parsedNumber: number = parseFloat(numberToRound.toString());
  let roundedNumber: number = Math.ceil((parsedNumber + Number.EPSILON) * 100) / 100;
  return BigDecimal.fromString(roundedNumber.toString());
}

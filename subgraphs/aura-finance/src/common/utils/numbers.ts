import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = 18
): BigDecimal {
  return quantity.divDecimal(
    BigInt.fromI32(10)
      .pow(decimals as u8)
      .toBigDecimal()
  );
}

export function bigDecimalToBigInt(input: BigDecimal): BigInt {
  const str = input.truncate(0).toString();
  return BigInt.fromString(str);
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

// Ray is 27 decimal Wad is 18 decimal
// These functions were made for the AAVE subgraph. Visit the following link to verify that AAVE's definition for RAY units match what are needed for your protocol
// https://docs.aave.com/developers/v/2.0/glossary

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10)
    .pow(9)
    .div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

// Round BigDecimal to whole number
export function roundToWholeNumber(n: BigDecimal): BigDecimal {
  return n.truncate(0);
}

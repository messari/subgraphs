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
  let sorted = prices.sort((a, b) => {
    return a.equals(b) ? 0 : a.gt(b) ? 1 : -1;
  });

  let mid = Math.ceil(sorted.length / 2) as i32;
  if (sorted.length % 2 == 0) {
    return sorted[mid].plus(sorted[mid - 1]).div(BigDecimal.fromString("2"));
  }

  return sorted[mid - 1];
}

// Ray is 27 decimal Wad is 18 decimal
// These functions were made for the AAVE subgraph. Visit the following link to verify that AAVE's definition for RAY units match what are needed for your protocol
// https://docs.aave.com/developers/v/2.0/glossary

export const RAY = BigInt.fromI32(10).pow(27);
const WAD_RAY_RATIO = BigInt.fromI32(10).pow(9);
const WAD = BigInt.fromI32(10).pow(18);
const halfRAY = RAY.div(BigInt.fromI32(2));

export function rayToWad(a: BigInt): BigInt {
  let halfRatio = WAD_RAY_RATIO.div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(WAD_RAY_RATIO);
}

export function wadToRay(a: BigInt): BigInt {
  let result = a.times(WAD_RAY_RATIO);
  return result;
}

export function rayDiv(a: BigInt, b: BigInt): BigInt {
  let halfB = b.div(BigInt.fromI32(2));
  let result = a.times(RAY);
  result = result.plus(halfB);
  let division = result.div(b);
  return division;
}

export function rayMul(a: BigInt, b: BigInt): BigInt {
  let result = a.times(b);
  result = result.plus(halfRAY);
  let mult = result.div(RAY);
  return mult;
}

import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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

// Ray is 27 decimal Wad is 18 decimal

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

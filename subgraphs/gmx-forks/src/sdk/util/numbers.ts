import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  BIGDECIMAL_ZERO,
  BIGINT_TEN,
  DEFAULT_DECIMALS,
  INT_TWO,
} from "./constants";

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = DEFAULT_DECIMALS
): BigDecimal {
  return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

export function bigDecimalToBigInt(input: BigDecimal): BigInt {
  const str = input.truncate(0).toString();
  return BigInt.fromString(str);
}

// returns 10^exp
export function exponentToBigDecimal(exp: i32 = DEFAULT_DECIMALS): BigDecimal {
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
    return sorted[mid]
      .plus(sorted[mid - 1])
      .div(BigDecimal.fromString(INT_TWO.toString()));
  }

  return sorted[mid - 1];
}

export function safeDivide(a: BigDecimal, b: BigDecimal): BigDecimal {
  if (b == BIGDECIMAL_ZERO) return BIGDECIMAL_ZERO;

  return a.div(b);
}

export function poolArraySort(
  ref: Array<Bytes>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>,
  arr3: Array<BigInt>,
  arr4: Array<BigDecimal>,
  arr5: Array<BigInt>,
  arr6: Array<BigDecimal>,
  arr7: Array<BigInt>,
  arr8: Array<BigDecimal>,
  arr9: Array<BigInt>,
  arr10: Array<BigDecimal>
): void {
  if (
    ref.length != arr1.length ||
    ref.length != arr2.length ||
    ref.length != arr3.length ||
    ref.length != arr4.length ||
    ref.length != arr5.length ||
    ref.length != arr6.length ||
    ref.length != arr7.length ||
    ref.length != arr8.length ||
    ref.length != arr9.length ||
    ref.length != arr10.length
  ) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [
      ref[i].toHexString(),
      arr1[i].toString(),
      arr2[i].toString(),
      arr3[i].toString(),
      arr4[i].toString(),
      arr5[i].toString(),
      arr6[i].toString(),
      arr7[i].toString(),
      arr8[i].toString(),
      arr9[i].toString(),
      arr10[i].toString(),
    ];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    ref[i] = Bytes.fromHexString(sorter[i][0]);
    arr1[i] = BigInt.fromString(sorter[i][1]);
    arr2[i] = BigDecimal.fromString(sorter[i][2]);
    arr3[i] = BigInt.fromString(sorter[i][3]);
    arr4[i] = BigDecimal.fromString(sorter[i][4]);
    arr5[i] = BigInt.fromString(sorter[i][5]);
    arr6[i] = BigDecimal.fromString(sorter[i][6]);
    arr7[i] = BigInt.fromString(sorter[i][7]);
    arr8[i] = BigDecimal.fromString(sorter[i][8]);
    arr9[i] = BigInt.fromString(sorter[i][9]);
    arr10[i] = BigDecimal.fromString(sorter[i][10]);
  }
}

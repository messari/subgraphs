import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { INT_ZERO } from "./constants";

export function bigDecimalToBigInt(input: BigDecimal): BigInt {
  const str = input.truncate(0).toString();
  return BigInt.fromString(str);
}

// convert emitted values to tokens count
export function convertTokenToDecimal(
  tokenAmount: BigInt,
  exchangeDecimals: i32 = 18
): BigDecimal {
  if (exchangeDecimals == INT_ZERO) {
    return tokenAmount.toBigDecimal();
  }

  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals));
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

// insert value into arr at index
export function insert<Type>(
  arr: Array<Type>,
  index: i32,
  value: Type
): Array<Type> {
  const result: Type[] = [];
  for (let i = 0; i < index; i++) {
    result.push(arr[i]);
  }
  result.push(value);
  for (let i = index; i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result;
}

// Ray is 27 decimal Wad is 18 decimal
// These functions were made for the AAVE subgraph. Visit the following link to verify that AAVE's definition for RAY units match what are needed for your protocol
// https://docs.aave.com/developers/v/2.0/glossary

export function rayToWad(a: BigInt): BigInt {
  const halfRatio = BigInt.fromI32(10).pow(9).div(BigInt.fromI32(2));
  return halfRatio.plus(a).div(BigInt.fromI32(10).pow(9));
}

export function wadToRay(a: BigInt): BigInt {
  const result = a.times(BigInt.fromI32(10).pow(9));
  return result;
}

export function multiArraySort(
  ref: Array<Bytes>,
  arr1: Array<BigInt>,
  arr2: Array<BigDecimal>
): void {
  if (ref.length != arr1.length || ref.length != arr2.length) {
    // cannot sort
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < ref.length; i++) {
    sorter[i] = [ref[i].toHexString(), arr1[i].toString(), arr2[i].toString()];
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
  }
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

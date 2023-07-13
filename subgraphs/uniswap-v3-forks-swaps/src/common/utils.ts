import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { BIGDECIMAL_TEN_THOUSAND, BIGINT_ZERO } from "./constants";

export function convertFeeToPercent(fee: i64): BigDecimal {
  return BigDecimal.fromString(fee.toString()).div(BIGDECIMAL_TEN_THOUSAND);
}

// Convert string list to Bytes list
export function stringToBytesList(list: string[]): Bytes[] {
  const result = new Array<Bytes>(list.length);
  for (let i = 0; i < list.length; i++) {
    result[i] = Bytes.fromHexString(list[i]);
  }
  return result;
}

// Sum BigInt Lists of same length by index
export function sumBigIntListByIndex(lists: BigInt[][]): BigInt[] {
  const sum = new Array<BigInt>(lists[0].length).fill(BIGINT_ZERO);
  for (let i = 0; i < lists.length; i++) {
    for (let j = 0; j < lists[i].length; j++) {
      sum[j] = sum[j].plus(lists[i][j]);
    }
  }
  return sum;
}

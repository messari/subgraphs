import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import {
  BIGINT_TEN,
  ETH_DECIMALS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";

export function addToArrayAtIndex<T>(x: T[], item: T, index: i32 = -1): T[] {
  if (x.length == 0) {
    return [item];
  }
  if (index == -1 || index > x.length) {
    index = x.length;
  }
  const retval = new Array<T>();
  let i = 0;
  while (i < index) {
    retval.push(x[i]);
    i += 1;
  }
  retval.push(item);
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY);
}

export function getHoursSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_HOUR);
}

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = ETH_DECIMALS
): BigDecimal {
  return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

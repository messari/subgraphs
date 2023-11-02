import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import {
  BIGINT_TEN,
  ETH_DECIMALS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
} from "./constants";

export function getHoursSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_HOUR);
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): i32 {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY);
}

export function bigIntToBigDecimal(
  quantity: BigInt,
  decimals: i32 = ETH_DECIMALS
): BigDecimal {
  return quantity.divDecimal(BIGINT_TEN.pow(decimals as u8).toBigDecimal());
}

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

export function removeFromArrayAtIndex<T>(x: T[], index: i32): T[] {
  const retval = new Array<T>(x.length - 1);
  let nI = 0;
  for (let i = 0; i < x.length; i++) {
    if (i != index) {
      retval[nI] = x[i];
      nI += 1;
    }
  }
  return retval;
}

export function updateArrayAtIndex<T>(x: T[], item: T, index: i32): T[] {
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
  i += 1;
  while (i < x.length) {
    retval.push(x[i]);
    i += 1;
  }
  return retval;
}

export function accountArraySort(
  pools: Array<Bytes>,
  poolBalance: Array<BigInt>,
  poolBalanceUSD: Array<BigDecimal>,
  _hasWithdrawnFromPool: Array<boolean>
): void {
  if (
    pools.length != poolBalance.length ||
    pools.length != poolBalanceUSD.length ||
    pools.length != _hasWithdrawnFromPool.length
  ) {
    return;
  }

  const sorter: Array<Array<string>> = [];
  for (let i = 0; i < pools.length; i++) {
    sorter[i] = [
      pools[i].toHexString(),
      poolBalance[i].toString(),
      poolBalanceUSD[i].toString(),
      _hasWithdrawnFromPool[i].toString(),
    ];
  }

  sorter.sort(function (a: Array<string>, b: Array<string>): i32 {
    if (a[0] < b[0]) {
      return -1;
    }
    return 1;
  });

  for (let i = 0; i < sorter.length; i++) {
    pools[i] = Bytes.fromHexString(sorter[i][0]);
    poolBalance[i] = BigInt.fromString(sorter[i][1]);
    poolBalanceUSD[i] = BigDecimal.fromString(sorter[i][2]);
    _hasWithdrawnFromPool[i] = sorter[i][3] == "true";
  }
}

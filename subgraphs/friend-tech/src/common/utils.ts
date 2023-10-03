import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

import { BIGINT_TEN, ETH_DECIMALS, SECONDS_PER_DAY } from "./constants";
import { getOrCreateEthToken } from "./getters";

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

export function getUsdPriceForEthAmount(
  amount: BigInt,
  event: ethereum.Event
): BigDecimal {
  const eth = getOrCreateEthToken(event);

  return amount
    .toBigDecimal()
    .div(BIGINT_TEN.pow(ETH_DECIMALS as u8).toBigDecimal())
    .times(eth.lastPriceUSD!);
}

/* eslint-disable rulesdir/no-non-standard-filenames */
import { BigInt } from "@graphprotocol/graph-ts";
import { BIGINT_TEN, SECONDS_PER_DAY } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const MINUTE = BigInt.fromI32(60);
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const HOUR = BigInt.fromI32(3600);
// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const DAY = BigInt.fromI32(86400);

export const ONE = BigInt.fromI32(1);

export function getMinuteOpenTime(timestamp: BigInt): BigInt {
  const interval = MINUTE;
  return getOpenTime(timestamp, interval);
}

export function getMinuteCloseTime(timestamp: BigInt): BigInt {
  return getMinuteOpenTime(timestamp).plus(MINUTE).minus(ONE);
}

export function getTenMinuteOpenTime(timestamp: BigInt): BigInt {
  const interval = MINUTE.times(BIGINT_TEN);
  return getOpenTime(timestamp, interval);
}

export function getTenMinuteCloseTime(timestamp: BigInt): BigInt {
  return getTenMinuteOpenTime(timestamp)
    .plus(MINUTE.times(BIGINT_TEN))
    .minus(ONE);
}

export function getHourOpenTime(timestamp: BigInt): BigInt {
  const interval = HOUR;
  return getOpenTime(timestamp, interval);
}

export function getHourCloseTime(timestamp: BigInt): BigInt {
  return getHourOpenTime(timestamp).plus(HOUR).minus(ONE);
}

export function getDayOpenTime(timestamp: BigInt): BigInt {
  const interval = DAY;
  return getOpenTime(timestamp, interval);
}

export function getDayCloseTime(timestamp: BigInt): BigInt {
  return getDayOpenTime(timestamp).plus(DAY).minus(ONE);
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

// helpers

export function getOpenTime(timestamp: BigInt, interval: BigInt): BigInt {
  const excess = timestamp.mod(interval);
  return timestamp.minus(excess);
}

export function isSameDay(t1: BigInt, t2: BigInt): boolean {
  const startOfDay1 = getDayOpenTime(t1);
  const startOfDay2 = getDayOpenTime(t2);

  return startOfDay1.equals(startOfDay2);
}

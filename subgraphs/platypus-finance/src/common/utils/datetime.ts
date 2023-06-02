import { BigInt } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../constants";

export const minute = BigInt.fromI32(60);
export const hour = BigInt.fromI32(3600);
export const day = BigInt.fromI32(86400);

export const one = BigInt.fromI32(1);

export function getDays(timestamp: i64): i64 {
  // Get number of days since epoch time
  return timestamp / SECONDS_PER_DAY;
}

export function getHours(timestamp: i64): i64 {
  // Get Hour of the Day
  return timestamp / SECONDS_PER_HOUR;
}

export function getMinuteOpenTime(timestamp: BigInt): BigInt {
  const interval = minute;
  return getOpenTime(timestamp, interval);
}

export function getMinuteCloseTime(timestamp: BigInt): BigInt {
  return getMinuteOpenTime(timestamp).plus(minute).minus(one);
}

export function getTenMinuteOpenTime(timestamp: BigInt): BigInt {
  const interval = minute.times(BigInt.fromI32(10));
  return getOpenTime(timestamp, interval);
}

export function getTenMinuteCloseTime(timestamp: BigInt): BigInt {
  return getTenMinuteOpenTime(timestamp)
    .plus(minute.times(BigInt.fromI32(10)))
    .minus(one);
}

export function getHourOpenTime(timestamp: BigInt): BigInt {
  const interval = hour;
  return getOpenTime(timestamp, interval);
}

export function getHourCloseTime(timestamp: BigInt): BigInt {
  return getHourOpenTime(timestamp).plus(hour).minus(one);
}

export function getDayOpenTime(timestamp: BigInt): BigInt {
  const interval = day;
  return getOpenTime(timestamp, interval);
}

export function getDayCloseTime(timestamp: BigInt): BigInt {
  return getDayOpenTime(timestamp).plus(day).minus(one);
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

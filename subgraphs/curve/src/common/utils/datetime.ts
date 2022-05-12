import { BigInt } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY } from "../constants";

export let minute = BigInt.fromI32(60);
export let hour = BigInt.fromI32(3600);
export let day = BigInt.fromI32(86400);

export let one = BigInt.fromI32(1);

export function getMinuteOpenTime(timestamp: BigInt): BigInt {
  let interval = minute;
  return getOpenTime(timestamp, interval);
}

export function getMinuteCloseTime(timestamp: BigInt): BigInt {
  return getMinuteOpenTime(timestamp).plus(minute).minus(one);
}

export function getTenMinuteOpenTime(timestamp: BigInt): BigInt {
  let interval = minute.times(BigInt.fromI32(10));
  return getOpenTime(timestamp, interval);
}

export function getTenMinuteCloseTime(timestamp: BigInt): BigInt {
  return getTenMinuteOpenTime(timestamp)
    .plus(minute.times(BigInt.fromI32(10)))
    .minus(one);
}

export function getHourOpenTime(timestamp: BigInt): BigInt {
  let interval = hour;
  return getOpenTime(timestamp, interval);
}

export function getHourCloseTime(timestamp: BigInt): BigInt {
  return getHourOpenTime(timestamp).plus(hour).minus(one);
}

export function getDayOpenTime(timestamp: BigInt): BigInt {
  let interval = day;
  return getOpenTime(timestamp, interval);
}

export function getDayCloseTime(timestamp: BigInt): BigInt {
  return getDayOpenTime(timestamp).plus(day).minus(one);
}

export function getDaysSinceEpoch(secondsSinceEpoch: number): string {
  return (<i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY)).toString();
}

// helpers

export function getOpenTime(timestamp: BigInt, interval: BigInt): BigInt {
  let excess = timestamp.mod(interval);
  return timestamp.minus(excess);
}

export function isSameDay(t1: BigInt, t2: BigInt): boolean {
  let startOfDay1 = getDayOpenTime(t1);
  let startOfDay2 = getDayOpenTime(t2);

  return startOfDay1.equals(startOfDay2);
}

export const DAY = BigInt.fromI32(60 * 60 * 24);
export const WEEK = BigInt.fromI32(60 * 60 * 24 * 7);
export const HOUR = BigInt.fromI32(60 * 60);

export function getIntervalFromTimestamp(timestamp: BigInt, interval: BigInt): BigInt {
  return timestamp.div(interval).times(interval);
}

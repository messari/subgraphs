import { BigInt } from '@graphprotocol/graph-ts';

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

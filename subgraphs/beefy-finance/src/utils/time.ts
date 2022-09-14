import { BigInt } from "@graphprotocol/graph-ts";

const SECONDS_PER_DAY = 24 * 60 * 60;
const SECONDS_PER_HOUR = 60 * 60;

export function getDaysSinceEpoch(secondsSinceEpoch: number): number {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_DAY);
}

export function getHoursSinceEpoch(secondsSinceEpoch: number): number {
  return <i32>Math.floor(secondsSinceEpoch / SECONDS_PER_HOUR);
}

export function getBeginOfTheDayTimestamp(secondsSinceEpoch: BigInt): BigInt {
  return secondsSinceEpoch.minus(
    secondsSinceEpoch.mod(BigInt.fromI32(SECONDS_PER_DAY))
  );
}

export function getBeginOfTheHourTimestamp(secondsSinceEpoch: BigInt): BigInt {
  return secondsSinceEpoch.minus(
    secondsSinceEpoch.mod(BigInt.fromI32(SECONDS_PER_HOUR))
  );
}

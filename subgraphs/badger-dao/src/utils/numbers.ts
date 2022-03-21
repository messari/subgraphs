import { BigInt } from '@graphprotocol/graph-ts';

export function getDay(timestamp: BigInt): i32 {
  return timestamp.toI32() / 60 / 60 / 24;
}

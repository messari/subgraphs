import { BigInt } from '@graphprotocol/graph-ts';
import { SECONDS_PER_DAY } from '../constant';

export function getDay(timestamp: BigInt): i32 {
  return timestamp.toI32() / SECONDS_PER_DAY;
}

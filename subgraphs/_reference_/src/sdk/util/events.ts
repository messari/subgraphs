import { ethereum } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";

export function getUnixDays(event: ethereum.Event): i32 {
  return event.block.timestamp.toI32() / SECONDS_PER_DAY;
}

export function getUnixHours(event: ethereum.Event): i32 {
  return event.block.timestamp.toI32() / SECONDS_PER_HOUR;
}

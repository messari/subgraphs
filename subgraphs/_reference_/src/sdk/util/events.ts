import { ethereum } from "@graphprotocol/graph-ts";

export function getUnixDays(event: ethereum.Event): i32 {
  return event.block.timestamp.toI32() / 86400;
}

export function getUnixHours(event: ethereum.Event): i32 {
  return event.block.timestamp.toI32() / 3600;
}

import { ethereum } from "@graphprotocol/graph-ts";
import { SECONDS_PER_DAY, SECONDS_PER_HOUR } from "./constants";

export function getUnixDays(block: ethereum.Block): i32 {
  return block.timestamp.toI32() / SECONDS_PER_DAY;
}

export function getUnixHours(block: ethereum.Block): i32 {
  return block.timestamp.toI32() / SECONDS_PER_HOUR;
}

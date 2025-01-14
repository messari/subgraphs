import { Bytes, ethereum } from "@graphprotocol/graph-ts";
import { HourlySnapshot } from "../generated/schema";
import { SECONDS_PER_HOUR } from "./constants";

export function getOrInitHourlySnapshot(
    event: ethereum.Event,
    // reserve: Reserve
  ): HourlySnapshot {
    const hours = event.block.timestamp.toI32() / SECONDS_PER_HOUR;
    const id = Bytes.fromI32(hours);
    let hourlySnapshot = HourlySnapshot.load(id);
    if (!hourlySnapshot) {
        hourlySnapshot = new HourlySnapshot(id);
        hourlySnapshot.blockNumber = event.block.number
        hourlySnapshot.timestamp = event.block.timestamp
    }
    return hourlySnapshot as HourlySnapshot;
  }
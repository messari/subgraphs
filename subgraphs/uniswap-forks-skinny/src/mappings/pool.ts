import { createSwap, createSync } from "../common/creators";

import { Swap, Sync } from "../../generated/templates/Pair/Pair";

export function handleSwap(event: Swap): void {
  createSwap(
    event,
    event.params.to.toHexString(),
    event.params.sender.toHexString(),
    event.params.amount0In,
    event.params.amount1In,
    event.params.amount0Out,
    event.params.amount1Out
  );
}

export function handleSync(event: Sync): void {
  createSync(
    event.address.toHexString(),
    event.params.reserve0,
    event.params.reserve1
  );
}

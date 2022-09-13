import { log } from "@graphprotocol/graph-ts";

import { PairCreated } from "../../../../generated/Factory/Factory";
import { createLiquidityPool } from "../common/creators";

export function handlePairCreated(event: PairCreated): void {
  log.info("create farm {}    {}     {}", [
    event.params.pair.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString(),
  ]);
  createLiquidityPool(
    event,
    event.params.pair.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString()
  );
}

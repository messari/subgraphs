// import { log } from "@graphprotocol/graph-ts";
import { PairCreated } from "../../generated/Factory/Factory";
import { createLiquidityPool } from "../common/creators";

export function handlePairCreated(event: PairCreated): void {
  createLiquidityPool(event, event.params.pair.toHexString(), event.params.token0.toHexString(), event.params.token1.toHexString());
}

import { PairCreated } from "../../generated/PairFactory/PairFactory";
import { createLiquidityPool } from "./helpers/entities";

export function handlePairCreated(event: PairCreated): void {
  createLiquidityPool(
    event,
    event.params.pair,
    event.params.token0,
    event.params.token1,
    event.params.stable
  );
}

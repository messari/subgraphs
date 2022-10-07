import { PairCreated } from "../../generated/PairFactory/PairFactory";
import { createLiquidityPool } from "./helpers/entities";
import { updateAllPoolFees } from "./helpers/pools";

export function handlePairCreated(event: PairCreated): void {
  createLiquidityPool(
    event,
    event.params.pair,
    event.params.token0,
    event.params.token1,
    event.params.stable
  );
  updateAllPoolFees(event.block, true);
}

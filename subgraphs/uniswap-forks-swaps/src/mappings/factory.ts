import { createLiquidityPool } from "../common/creators";

import { PairCreated } from "../../generated/Factory/Factory";

export function handlePairCreated(event: PairCreated): void {
  createLiquidityPool(
    event,
    event.params.pair.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString()
  );
}

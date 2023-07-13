import { NetworkConfigs } from "../../configurations/configure";
import { createLiquidityPool } from "../common/entities/pool";

import { PoolCreated } from "../../generated/Factory/Factory";

export function handlePoolCreated(event: PoolCreated): void {
  if (NetworkConfigs.getUntrackedPairs().includes(event.params.pool)) {
    return;
  }
  createLiquidityPool(
    event,
    event.params.pool,
    event.params.token0,
    event.params.token1,
    event.params.fee
  );
}

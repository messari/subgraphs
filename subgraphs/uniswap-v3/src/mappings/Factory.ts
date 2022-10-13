// import { log } from '@graphprotocol/graph-ts'
import { PoolCreated } from "../../generated//Factory/Factory";
import { createLiquidityPool } from "../common/creators";
import { NetworkConfigs } from "../../configurations/configure";

// Liquidity pool is created from the Factory contract.
// Create a pool entity and start monitoring events from the newly deployed pool contract specified in the subgraph.yaml.
export function handlePoolCreated(event: PoolCreated): void {
  if (
    NetworkConfigs.getUntrackedPairs().includes(event.params.pool.toHexString())
  ) {
    return;
  }
  createLiquidityPool(
    event,
    event.params.pool.toHexString(),
    event.params.token0.toHexString(),
    event.params.token1.toHexString(),
    event.params.fee
  );
}

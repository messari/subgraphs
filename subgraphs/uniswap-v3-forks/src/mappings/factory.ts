// import { log } from '@graphprotocol/graph-ts'
import { Network } from "../common/constants";
import { createLiquidityPool } from "../common/entities/pool";
import { populateEmptyPools } from "../common/utils/backfill";
import { NetworkConfigs } from "../../configurations/configure";
import { getOrCreateProtocol } from "../common/entities/protocol";
import { PoolCreated } from "../../generated/templates/Pool/Factory";

// Liquidity pool is created from the Factory contract.
// Create a pool entity and start monitoring events from the newly deployed pool contract specified in the subgraph.yaml.
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

  const protocol = getOrCreateProtocol();
  // populate pre-regenesis pools if needed
  if (
    NetworkConfigs.getNetwork() == Network.OPTIMISM &&
    protocol._regenesis == false
  ) {
    populateEmptyPools(event);
  }
}

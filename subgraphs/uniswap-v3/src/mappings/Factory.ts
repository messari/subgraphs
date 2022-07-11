// import { log } from '@graphprotocol/graph-ts'
import { PoolCreated } from "../../generated//Factory/Factory";
import { Address } from "@graphprotocol/graph-ts";
import { createLiquidityPool } from "../common/creators";

// Liquidity pool is created from the Factory contract.
// Create a pool entity and start monitoring events from the newly deployed pool contract specified in the subgraph.yaml.
export function handlePoolCreated(event: PoolCreated): void {
  // temp fix
  if (
    event.params.pool ==
    Address.fromHexString("0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248")
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

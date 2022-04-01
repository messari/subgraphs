import {
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
} from "../../generated/Factory/Factory";
import { BasePool, LiquidityPool } from "../../generated/schema";
import { Pool } from "../../generated/templates";
import {
  getOrCreateBasePool,
  getOrCreatePoolFromFactory,
} from "../helpers/pool/createPool";

// Call handlers
export function handleBasePoolAdded(event: BasePoolAdded): void {
  let basePoolAddress = event.params.base_pool;

  // Create a new pool
  getOrCreateBasePool(basePoolAddress);

  Pool.create(basePoolAddress);
}
export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  let coins = event.params.coins;
  let fee = event.params.fee;
  let lp_token = event.params.lp_token;
  let pool = event.params.pool;

  // Create a new pool
  getOrCreatePoolFromFactory(
    coins,
    fee,
    lp_token,
    pool,
    event.block.timestamp,
    event.block.number
  );

  Pool.create(pool);
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let coins = event.params.coins;
  let fee = event.params.fee;
  let lp_token = event.params.lp_token;
  let pool = event.params.pool;
  let base_pool = event.params.base_pool;

  // Create a new pool
  getOrCreatePoolFromFactory(
    coins,
    fee,
    lp_token,
    pool,
    event.block.timestamp,
    event.block.number
  );

  // Update base pool
  let liquidityPool = LiquidityPool.load(pool.toHexString());
  if (liquidityPool !== null) {
    liquidityPool._basePool = getOrCreateBasePool(base_pool).id;
    liquidityPool.save();
  }

  Pool.create(pool);
}

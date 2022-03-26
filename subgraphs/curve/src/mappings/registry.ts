import {
  BasePoolAdded,
  Deploy_metapoolCall,
  Deploy_metapool1Call,
  Deploy_plain_poolCall,
  Deploy_plain_pool1Call,
  Deploy_plain_pool2Call,
} from "../../generated/Factory/Factory";

import { PoolLPToken as PoolDataSource } from "../../generated/templates";
import {
  CreatePoolFromFactory,
  getOrCreateBasePool,
} from "../helpers/pool";
import { PoolType } from "../utils/constant";

// Call handlers
export function handleBasePoolAdded(event: BasePoolAdded): void {
  let basePoolAddress = event.params.base_pool;

  // Create a new pool
  getOrCreateBasePool(basePoolAddress);

  PoolDataSource.create(basePoolAddress);
}
export function handleDeployMetaPool(call: Deploy_metapoolCall): void {
  let A = call.inputs._A;
  let base_pool = call.inputs._base_pool;
  let coin = call.inputs._coin;
  let name = call.inputs._name;
  let fee = call.inputs._fee;
  let symbol = call.inputs._symbol;
  let poolAddress = call.outputs.value0;

  // Create a new pool
  CreatePoolFromFactory(call, poolAddress, name, symbol, PoolType.META);

  PoolDataSource.create(poolAddress);
}

export function handleDeployMetaPool1(call: Deploy_metapool1Call): void {
  let A = call.inputs._A;
  let base_pool = call.inputs._base_pool;
  let coin = call.inputs._coin;
  let name = call.inputs._name;
  let fee = call.inputs._fee;
  let symbol = call.inputs._symbol;
  let poolAddress = call.outputs.value0;

  // Create a new pool
  CreatePoolFromFactory(call, poolAddress, name, symbol, PoolType.META);

  PoolDataSource.create(poolAddress);
}

export function handleDeployPlainPool(call: Deploy_plain_poolCall): void {
  let A = call.inputs._A;
  let coins = call.inputs._coins;
  let name = call.inputs._name;
  let symbol = call.inputs._symbol;
  let fee = call.inputs._fee;
  let poolAddress = call.outputs.value0;

  // Create a new pool
  CreatePoolFromFactory(call, poolAddress, name, symbol, PoolType.PLAIN);

  PoolDataSource.create(poolAddress);
}

export function handleDeployPlainPool1(call: Deploy_plain_pool1Call): void {
  let A = call.inputs._A;
  let asset_type = call.inputs._asset_type;
  let coins = call.inputs._coins;
  let name = call.inputs._name;
  let fee = call.inputs._fee;
  let symbol = call.inputs._symbol;
  let poolAddress = call.outputs.value0;

  // Create a new pool
  CreatePoolFromFactory(call, poolAddress, name, symbol, PoolType.PLAIN);

  PoolDataSource.create(poolAddress);
}

export function handleDeployPlainPool2(call: Deploy_plain_pool2Call): void {
  let A = call.inputs._A;
  let asset_type = call.inputs._asset_type;
  let coins = call.inputs._coins;
  let name = call.inputs._name;
  let fee = call.inputs._fee;
  let symbol = call.inputs._symbol;
  let poolAddress = call.outputs.value0;

  // Create a new pool
  CreatePoolFromFactory(call, poolAddress, name, symbol, PoolType.PLAIN);

  PoolDataSource.create(poolAddress);
}


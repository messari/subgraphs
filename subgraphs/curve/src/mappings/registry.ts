import {
  Address,
  store,
  ethereum,
  dataSource,
  BigDecimal,
} from "@graphprotocol/graph-ts";

import {
  Add_metapoolCall,
  Add_metapool1Call,
  Add_poolCall,
  Add_pool_without_underlyingCall,
  PoolRemoved,
} from "../../generated/MainRegistry/Registry";

import { StableSwap } from "../../generated/MainRegistry/StableSwap";
import { Pool as PoolDataSource } from "../../generated/templates";

import { DexAmmProtocol} from "../../generated/schema";
import {
  Network,
  ProtocolType,
  REGISTRY_ADDRESS,
} from "../utils/constant";

import { CreatePool, removePool } from "../utils/pool";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = Address.fromString(REGISTRY_ADDRESS).toHexString();
  let protocol = DexAmmProtocol.load(id);
  if (!protocol) {
    protocol = new DexAmmProtocol(id);
    protocol.name = "curve finance";
    protocol.slug = "curve-finance";
    protocol.network = Network.ETHEREUM;
    protocol.type = ProtocolType.EXCHANGE;

    protocol.save();

    return protocol as DexAmmProtocol;
  }
  return protocol as DexAmmProtocol;
}

// Call handlers
export function handleAddMetaPool(call: Add_metapoolCall): void {
  let poolAddress = call.inputs._pool
  let lpToken = call.inputs._lp_token 
  let name = call.inputs._name

  // Create a new pool
  CreatePool(call, poolAddress, lpToken, name);

  PoolDataSource.create(poolAddress);
}
export function handleAddMeta1Pool(call: Add_metapool1Call): void {
  let poolAddress = call.inputs._pool
  let lpToken = call.inputs._lp_token 
  let name = call.inputs._name

  // Create a new pool
  CreatePool(call, poolAddress, lpToken, name);

  PoolDataSource.create(poolAddress);
}

export function handleAddPool(call: Add_poolCall): void {
  let poolAddress = call.inputs._pool
  let lpToken = call.inputs._lp_token 
  let name = call.inputs._name

  // Create a new pool
  CreatePool(call, poolAddress, lpToken, name);

  PoolDataSource.create(poolAddress);
}

export function handleAddPoolWithUnderlying(call: Add_pool_without_underlyingCall): void {
  let poolAddress = call.inputs._pool
  let lpToken = call.inputs._lp_token 
  let name = call.inputs._name

  // Create a new pool
  CreatePool(call, poolAddress, lpToken, name);

  PoolDataSource.create(poolAddress);
}

// Event handlers
export function handlePoolRemoved(event: PoolRemoved): void {
  // Remove existing pool
  removePool(event.params.pool, event);
}

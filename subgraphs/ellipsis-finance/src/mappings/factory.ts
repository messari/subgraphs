import {
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
  CryptoPoolDeployed,
} from "../../generated/Factory/Factory";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import { PoolTemplate } from "../../generated/templates";
import { getOrCreateLiquidityPool } from "../common/initializers";

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  let registryAddress = event.address;
  let poolAddress = event.params.pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  log.warning(
    "[PlainPoolDeployed] PoolAddress: {}, Registry: {}, TxnHash: {}",
    [
      poolAddress.toHexString(),
      registryAddress.toHexString(),
      event.transaction.hash.toHexString(),
    ]
  );
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let registryAddress = event.address;
  let poolAddress = event.params.pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  
  log.warning("[MetaPoolDeployed] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleBasePoolAdded(event: BasePoolAdded): void {
  let registryAddress = event.address;
  let poolAddress = event.params.base_pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  log.warning("[BasePoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

export function handleCryptoPoolDeployed(event: CryptoPoolDeployed): void {
  let registryAddress = event.address;
  let poolAddress = event.params.pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  log.warning("[MetaPoolDeployed] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

import {
  PoolAdded,
  BasePoolAdded,
  MetaPoolDeployed,
  PlainPoolDeployed,
  LiquidityGaugeDeployed,
} from "../../generated/templates/PoolTemplate/Registry";
import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { PoolTemplate } from "../../generated/templates";
import { getOrCreateLiquidityPool } from "../common/initializers";

export function handlePoolAdded(event: PoolAdded): void {
  let registryAddress = event.address;
  let poolAddress = event.params.pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning("[PoolAdded] PoolAddress: {}", [poolAddress.toHexString()]);
}

export function handleBasePoolAdded(event: BasePoolAdded): void {
  let registryAddress = event.address;
  let poolAddress = event.params.base_pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning("[BasePoolAdded] PoolAddress: {}", [poolAddress.toHexString()]);
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let registryAddress = event.address;
  let coinAddress = event.params.coin;
  let poolAddress = event.params.base_pool;

  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block);

  PoolTemplate.create(poolAddress);

  log.warning("[MetaPoolDeployed] PoolAddress: {}, coinAddress: {}", [
    poolAddress.toHexString(),
    coinAddress.toHexString(),
  ]);
}

export function handleLiquidityGaugeDeployed(
  event: LiquidityGaugeDeployed
): void {}

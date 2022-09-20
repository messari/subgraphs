import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  PoolAdded,
} from "../../generated/Registry/Registry"
import { getOrCreateLiquidityPool } from "../common/initializers"
import * as utils from "../common/utils";
import {PoolTemplate} from '../../generated/templates'

export function handlePoolAdded(event: PoolAdded): void {
  let poolAddress = event.params.pool;
  let registryAddress = event.address;
  if (utils.checkIfPoolExists(poolAddress)
  ) return;
  getOrCreateLiquidityPool(poolAddress, event.block);
  
  PoolTemplate.create(poolAddress);

  log.warning("[PoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  
}


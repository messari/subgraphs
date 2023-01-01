import * as utils from "../common/utils";
import { log } from "@graphprotocol/graph-ts";
import { PoolAdded } from "../../generated/Registry/Registry";
import { getOrCreateLiquidityPool } from "../common/initializers";

export function handlePoolAdded(event: PoolAdded): void {
  const poolAddress = event.params.pool;
  const registryAddress = event.address;
  if (utils.checkIfPoolExists(poolAddress)) return;
  getOrCreateLiquidityPool(poolAddress, event.block, registryAddress);

  log.warning("[PoolAdded] PoolAddress: {}, Registry: {}, TxnHash: {}", [
    poolAddress.toHexString(),
    registryAddress.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
}

import { Address } from "@graphprotocol/graph-ts";
import { _StabilityPool } from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../utils/constants";

export function getStabilityPool(asset: Address): _StabilityPool | null {
  const id = asset.toHexString();
  return _StabilityPool.load(id);
}

export function getOrCreateStabilityPool(asset: Address): _StabilityPool {
  const id = asset.toHexString();
  let stabilityPool = _StabilityPool.load(id);
  if (stabilityPool == null) {
    stabilityPool = new _StabilityPool(id);
    stabilityPool.id = asset.toHexString();
    stabilityPool.totalValueLocked = BIGDECIMAL_ZERO;
    stabilityPool.save();
  }
  return stabilityPool;
}

import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { _StabilityPool } from "../../generated/schema";
import { updateProtocolUSDLocked } from "./protocol";
import { BIGDECIMAL_ZERO } from "../utils/constants";

export function getStabilityPool(asset: Address): _StabilityPool | null {
  const id = asset.toHexString();
  return _StabilityPool.load(id);
}

export function createStabilityPool(asset: Address): _StabilityPool {
  const id = asset.toHexString();
  const stabilityPool = new _StabilityPool(id);
  stabilityPool.id = asset.toHexString();
  stabilityPool.totalValueLocked = BIGDECIMAL_ZERO;
  stabilityPool.save();
  return stabilityPool;
}

export function getOrCreateStabilityPool(asset: Address): _StabilityPool {
  const id = asset.toHexString();
  let stabilityPool = _StabilityPool.load(id);
  if (stabilityPool == null) {
    stabilityPool = createStabilityPool(asset);
  }
  return stabilityPool;
}

export function updateStabilityPoolUSDLocked(
  event: ethereum.Event,
  asset: Address,
  totalValueLocked: BigDecimal
): void {
  const stabilityPool = getOrCreateStabilityPool(asset);
  const previousTotalValueLocked = stabilityPool.totalValueLocked;
  stabilityPool.totalValueLocked = totalValueLocked;
  updateProtocolUSDLocked(
    event,
    totalValueLocked.minus(previousTotalValueLocked)
  );
  stabilityPool.save();
}

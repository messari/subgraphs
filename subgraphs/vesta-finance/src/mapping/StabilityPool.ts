import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import {
  StabilityPool,
  StabilityPoolAssetBalanceUpdated,
  StabilityPoolVSTBalanceUpdated,
} from "../../generated/templates/StabilityPool/StabilityPool";
import { updateProtocoVSTLocked } from "../entities/protocol";
import { updateStabilityPoolTVL } from "../entities/stabilitypool";
/**
 * Asset balance was updated
 *
 * @param event StabilityPoolAssetBalanceUpdated event
 */
export function handleStabilityPoolAssetBalanceUpdated(
  event: StabilityPoolAssetBalanceUpdated
): void {
  const stabilityPoolContract = StabilityPool.bind(event.address);
  const asset = stabilityPoolContract.getAssetType();
  const totalVSTAmount = stabilityPoolContract.getTotalVSTDeposits();
  const totalAssetAmount = event.params._newBalance;

  updateStabilityPoolTVL(event, totalVSTAmount, totalAssetAmount, asset);
  updateProtocoVSTLocked(event);
}

/**
 * VST balance was updated
 *
 * @param event StabilityPoolVSTBalanceUpdated event
 */
export function handleStabilityPoolVSTBalanceUpdated(
  event: StabilityPoolVSTBalanceUpdated
): void {
  const stabilityPoolContract = StabilityPool.bind(event.address);
  const asset = stabilityPoolContract.getAssetType();
  const totalVSTAmount = event.params._newBalance;
  const totalAssetAmount = stabilityPoolContract.getAssetBalance();

  updateStabilityPoolTVL(event, totalVSTAmount, totalAssetAmount, asset);
  updateProtocoVSTLocked(event);
}

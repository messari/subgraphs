import { log } from "@graphprotocol/graph-ts";
import {
  StabilityPool,
  StabilityPoolAssetBalanceUpdated,
  StabilityPoolVSTBalanceUpdated,
  UserDepositChanged,
  AssetGainWithdrawn,
} from "../../generated/templates/StabilityPool/StabilityPool";
import { createWithdraw } from "../entities/event";
import { getOrCreateStabilityPool } from "../entities/market";
import { updateSPUserPositionBalances } from "../entities/position";
import { updateProtocoVSTLocked } from "../entities/protocol";
import { updateStabilityPoolTVL } from "../entities/stabilitypool";
import { getCurrentAssetPrice, getOrCreateAssetToken } from "../entities/token";
import { BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

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

/**
 * Triggered when some deposit balance changes. We use this to track position
 * value and deposits. But cannot accurately tell when it was caused by a withdrawal
 * or just by the transformation of VST into Asset due to liquidations (see stability pool docs).
 *
 * @param event UserDepositChanged
 */
export function handleUserDepositChanged(event: UserDepositChanged): void {
  const stabilityPoolContract = StabilityPool.bind(event.address);
  const assetAddressResult = stabilityPoolContract.try_getAssetType();
  if (assetAddressResult.reverted) {
    log.error(
      "[handleAssetGainWithdrawn]StabilityPool.getAssetType() revert for tx {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }
  const asset = assetAddressResult.value;
  const market = getOrCreateStabilityPool(event.address, asset, event);
  updateSPUserPositionBalances(
    event,
    market,
    event.params._depositor,
    event.params._newDeposit
  );
}

/**
 * Triggered when Asset that has been converted from VST in the stability pool
 * is sent to its owner (the VST depositor).
 * These are the only StabilityPool withdrawals we are able to track.
 *
 * @param event AssetGainWithdrawn
 */
export function handleAssetGainWithdrawn(event: AssetGainWithdrawn): void {
  if (event.params._Asset.equals(BIGINT_ZERO)) {
    return;
  }
  const stabilityPoolContract = StabilityPool.bind(event.address);
  const assetAddressResult = stabilityPoolContract.try_getAssetType();
  if (assetAddressResult.reverted) {
    log.error(
      "[handleAssetGainWithdrawn]StabilityPool.getAssetType() revert for tx {}",
      [event.transaction.hash.toHexString()]
    );
    return;
  }
  const asset = assetAddressResult.value;
  const token = getOrCreateAssetToken(asset);
  const amountUSD = getCurrentAssetPrice(asset).times(
    bigIntToBigDecimal(event.params._Asset, token.decimals)
  );
  const market = getOrCreateStabilityPool(event.address, asset, event);
  createWithdraw(
    event,
    market,
    event.params._Asset,
    amountUSD,
    event.params._depositor,
    event.params._depositor
  );
}

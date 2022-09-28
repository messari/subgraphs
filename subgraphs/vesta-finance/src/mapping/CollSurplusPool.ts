import { Address } from "@graphprotocol/graph-ts";
import {
  CollSurplusPool,
  CollBalanceUpdated,
} from "../../generated/CollSurplusPool/CollSurplusPool";
import { createWithdraw } from "../entities/event";
import { getCurrentAssetPrice } from "../entities/token";
import { getTrove } from "../entities/trove";
import { getOrCreateLendingProtocol } from "../entities/protocol";
import { BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";

/**
 * Whenever a borrower's trove is closed by a non-owner address because of either:
 *   1. Redemption
 *   2. Liquidation in recovery mode with collateral ratio > 110%
 * the remaining collateral is sent to CollSurplusPool to be claimed (withdrawn) by the owner.
 * Because Asset price is not updated during the actual withdrawal, the Withdraw event is instead created upon collateral deposit
 *
 * @param event CollBalanceUpdated event
 */
export function handleCollBalanceUpdated(event: CollBalanceUpdated): void {
  const protocol = getOrCreateLendingProtocol();
  const assets = protocol._marketAssets;
  const account = event.params._account;
  const contract = CollSurplusPool.bind(event.address);
  let asset: string | null = null;

  // As the asset address is not included in the event's paramters, comparing every address's previous
  // balance with current balance to determine which asset the event is related with.
  for (let i = 0; i < assets.length; i++) {
    const tryAssetBalanceResult = contract.try_getCollateral(
      Address.fromString(assets[i]),
      account
    );
    const tmpTrove = getTrove(account, Address.fromString(assets[i]));
    if (tmpTrove != null && !tryAssetBalanceResult.reverted) {
      if (tryAssetBalanceResult.value != tmpTrove.collateralSurplus) {
        asset = assets[i];
        break;
      }
    }
  }

  if (asset == null) {
    return;
  }

  const collateralSurplusAsset = event.params._newBalance;
  const trove = getTrove(account, Address.fromString(asset!));
  if (trove != null) {
    if (collateralSurplusAsset > trove.collateralSurplus) {
      trove.collateralSurplusChange = collateralSurplusAsset.minus(
        trove.collateralSurplus
      );
      const collateralSurplusUSD = bigIntToBigDecimal(
        trove.collateralSurplusChange
      ).times(getCurrentAssetPrice(Address.fromString(asset!)));
      createWithdraw(
        event,
        Address.fromString(asset!),
        trove.collateralSurplusChange,
        collateralSurplusUSD,
        account,
        account
      );
    } else {
      trove.collateralSurplusChange = BIGINT_ZERO;
    }
    trove.collateralSurplus = collateralSurplusAsset;
    trove.save();
  }
}

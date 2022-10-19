import { Address } from "@graphprotocol/graph-ts";
import {
  Redemption,
  TroveLiquidated,
  TroveUpdated,
} from "../../generated/TroveManager/TroveManager";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove } from "../entities/trove";
import { getCurrentAssetPrice } from "../entities/token";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  LIQUIDATION_FEE,
  LIQUIDATION_RESERVE_VST,
} from "../utils/constants";
import { _Trove } from "../../generated/schema";
import {
  addProtocolSideRevenue,
  addSupplySideRevenue,
} from "../entities/protocol";
import { updateUserPositionBalances } from "../entities/position";

enum TroveManagerOperation {
  applyPendingRewards,
  liquidateInNormalMode,
  liquidateInRecoveryMode,
  redeemCollateral,
}

export function handleRedemption(event: Redemption): void {
  const asset = event.params._asset;
  const feeAmountAsset = event.params._AssetFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountAsset).times(
    getCurrentAssetPrice(event.params._asset)
  );
  addProtocolSideRevenue(event, asset, feeAmountUSD);
}

/**
 * Emitted when a trove was updated because of a TroveManagerOperation operation
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  //const trove = getOrCreateTrove(event.params._borrower);
  const trove = getOrCreateTrove(event.params._borrower, event.params._asset);
  const operation = event.params.operation as TroveManagerOperation;
  switch (operation) {
    case TroveManagerOperation.applyPendingRewards:
      applyPendingRewards(event, trove);
      break;
    case TroveManagerOperation.redeemCollateral:
      redeemCollateral(event, trove);
      break;
    case TroveManagerOperation.liquidateInNormalMode:
    case TroveManagerOperation.liquidateInRecoveryMode:
      liquidateTrove(event, trove);
      break;
  }
  trove.asset = event.params._asset.toHexString();
  trove.owner = event.params._borrower.toHexString();
  trove.collateral = event.params._coll;
  trove.debt = event.params._debt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

/**
 * Emitted for each trove liquidated during batch liquidation flow, right before TroveUpdated event
 * Used to check for and apply pending rewards, since no event is emitted for this during liquidation
 *
 * @param event TroveLiquidated event
 */
export function handleTroveLiquidated(event: TroveLiquidated): void {
  const trove = getOrCreateTrove(event.params._borrower, event.params._asset);
  const asset = event.params._asset;
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  // Gas compensation already subtracted, only when (MCR <= ICR < TCR & SP.VST >= trove.debt)
  if (trove.collateral.gt(newCollateral)) {
    // Add gas compensation back to liquidated collateral amount
    trove.collateral = trove.collateral
      .divDecimal(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
      .truncate(0).digits;
  }
  // Apply pending rewards if necessary
  let collateralRewardAsset = newCollateral.minus(trove.collateral);
  if (trove.collateralSurplusChange.gt(BIGINT_ZERO)) {
    collateralRewardAsset = collateralRewardAsset.plus(
      trove.collateralSurplusChange
    );
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  if (collateralRewardAsset.gt(BIGINT_ZERO)) {
    const collateralRewardUSD = bigIntToBigDecimal(collateralRewardAsset).times(
      getCurrentAssetPrice(asset)
    );
    createDeposit(
      event,
      asset,
      collateralRewardAsset,
      collateralRewardUSD,
      borrower
    );
  }
  const borrowAmountVST = newDebt.minus(trove.debt);
  if (borrowAmountVST.gt(BIGINT_ZERO)) {
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountVST);
    createBorrow(event, asset, borrowAmountVST, borrowAmountUSD, borrower);
  }
  trove.asset = event.params._asset.toHexString();
  trove.owner = event.params._borrower.toHexString();
  trove.collateral = newCollateral;
  trove.debt = newDebt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

// Treat applyPendingRewards as deposit + borrow
function applyPendingRewards(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;

  const collateralRewardAsset = newCollateral.minus(trove.collateral);
  const collateralRewardUSD = bigIntToBigDecimal(collateralRewardAsset).times(
    getCurrentAssetPrice(asset)
  );
  createDeposit(
    event,
    asset,
    collateralRewardAsset,
    collateralRewardUSD,
    borrower
  );
  const borrowAmountVST = newDebt.minus(trove.debt);
  const borrowAmountUSD = bigIntToBigDecimal(borrowAmountVST);
  createBorrow(event, asset, borrowAmountVST, borrowAmountUSD, borrower);
}

// Treat redeemCollateral as repay + withdraw
function redeemCollateral(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;

  const repayAmountVST = trove.debt.minus(newDebt);
  const repayAmountUSD = bigIntToBigDecimal(repayAmountVST);
  createRepay(
    event,
    asset,
    repayAmountVST,
    repayAmountUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );

  let withdrawAmountAsset = trove.collateral.minus(newCollateral);
  // If trove was closed, then extra collateral is sent to CollSurplusPool to be withdrawn by trove owner
  if (trove.collateral.equals(BIGINT_ZERO)) {
    withdrawAmountAsset = withdrawAmountAsset.minus(
      trove.collateralSurplusChange
    );
    trove.collateralSurplusChange = BIGINT_ZERO;
  }
  const withdrawAmountUSD = bigIntToBigDecimal(withdrawAmountAsset).times(
    getCurrentAssetPrice(asset)
  );
  createWithdraw(
    event,
    asset,
    withdrawAmountAsset,
    withdrawAmountUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );
}

function liquidateTrove(event: TroveUpdated, trove: _Trove): void {
  const asset = event.params._asset;
  const amountLiquidatedAsset = trove.collateral;
  const amountLiquidatedUSD = bigIntToBigDecimal(amountLiquidatedAsset).times(
    getCurrentAssetPrice(asset)
  );
  const profitUSD = amountLiquidatedUSD
    .times(LIQUIDATION_FEE)
    .plus(LIQUIDATION_RESERVE_VST);
  createLiquidate(
    event,
    asset,
    amountLiquidatedAsset,
    amountLiquidatedUSD,
    profitUSD,
    Address.fromString(trove.owner),
    event.transaction.from
  );
  const liquidatedDebtUSD = bigIntToBigDecimal(trove.debt);
  const supplySideRevenueUSD = amountLiquidatedUSD
    .times(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
    .minus(liquidatedDebtUSD);

  if (supplySideRevenueUSD.gt(BIGDECIMAL_ZERO)) {
    addSupplySideRevenue(event, asset, supplySideRevenueUSD);
  }
  addProtocolSideRevenue(event, asset, profitUSD);
}

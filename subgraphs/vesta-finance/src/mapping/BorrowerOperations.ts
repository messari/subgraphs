import {
  VSTBorrowingFeePaid,
  TroveUpdated,
} from "../../generated/BorrowerOperations/BorrowerOperations";
import {
  createBorrow,
  createDeposit,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove } from "../entities/trove";
import { getCurrentAssetPrice } from "../entities/token";
import { addProtocolSideRevenue } from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";
import { updateUserPositionBalances } from "../entities/position";

/**
 * Emitted when VST is borrowed from trove and a dynamic fee (0.5-5%) is charged (added to debt)
 *
 * @param event VSTBorrowingFeePaid event
 */
export function handleVSTBorrowingFeePaid(event: VSTBorrowingFeePaid): void {
  const asset = event.params._asset;
  const feeAmountVST = event.params._VSTFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountVST);
  addProtocolSideRevenue(event, asset, feeAmountUSD);
}

/**
 * Emitted when a trove was updated because of a BorrowerOperation (open/close/adjust)
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const asset = event.params._asset;
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  const trove = getOrCreateTrove(borrower, asset);

  if (newCollateral == trove.collateral && newDebt == trove.debt) {
    return;
  }
  if (newCollateral > trove.collateral) {
    const depositAmountAsset = newCollateral.minus(trove.collateral);
    const depositAmountUSD = bigIntToBigDecimal(depositAmountAsset).times(
      getCurrentAssetPrice(asset)
    );
    createDeposit(event, asset, depositAmountAsset, depositAmountUSD, borrower);
  } else if (newCollateral < trove.collateral) {
    const withdrawAmountAsset = trove.collateral.minus(newCollateral);
    const withdrawAmountUSD = bigIntToBigDecimal(withdrawAmountAsset).times(
      getCurrentAssetPrice(asset)
    );
    createWithdraw(
      event,
      asset,
      withdrawAmountAsset,
      withdrawAmountUSD,
      borrower,
      borrower
    );
  }

  if (newDebt > trove.debt) {
    const borrowAmountVST = newDebt.minus(trove.debt);
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountVST);
    createBorrow(event, asset, borrowAmountVST, borrowAmountUSD, borrower);
  } else if (newDebt < trove.debt) {
    const repayAmountVST = trove.debt.minus(newDebt);
    const repayAmountUSD = bigIntToBigDecimal(repayAmountVST);
    createRepay(
      event,
      asset,
      repayAmountVST,
      repayAmountUSD,
      borrower,
      borrower
    );
  }

  trove.collateral = newCollateral;
  trove.debt = newDebt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

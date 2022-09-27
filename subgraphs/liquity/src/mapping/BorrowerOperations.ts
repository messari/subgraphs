import {
  LUSDBorrowingFeePaid,
  TroveUpdated,
} from "../../generated/BorrowerOperations/BorrowerOperations";
import {
  createBorrow,
  createDeposit,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove } from "../entities/trove";
import { getCurrentETHPrice } from "../entities/token";
import { addProtocolSideRevenue } from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";
import { updateUserPositionBalances } from "../entities/position";

/**
 * Emitted when LUSD is borrowed from trove and a dynamic fee (0.5-5%) is charged (added to debt)
 *
 * @param event LUSDBorrowingFeePaid event
 */
export function handleLUSDBorrowingFeePaid(event: LUSDBorrowingFeePaid): void {
  const feeAmountLUSD = event.params._LUSDFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountLUSD);
  addProtocolSideRevenue(event, feeAmountUSD);
}

/**
 * Emitted when a trove was updated because of a BorrowerOperation (open/close/adjust)
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const borrower = event.params._borrower;
  const newCollateral = event.params._coll;
  const newDebt = event.params._debt;
  const trove = getOrCreateTrove(borrower);

  if (newCollateral == trove.collateral && newDebt == trove.debt) {
    return;
  }
  if (newCollateral > trove.collateral) {
    const depositAmountETH = newCollateral.minus(trove.collateral);
    const depositAmountUSD = bigIntToBigDecimal(depositAmountETH).times(
      getCurrentETHPrice()
    );
    createDeposit(event, depositAmountETH, depositAmountUSD, borrower);
  } else if (newCollateral < trove.collateral) {
    const withdrawAmountETH = trove.collateral.minus(newCollateral);
    const withdrawAmountUSD = bigIntToBigDecimal(withdrawAmountETH).times(
      getCurrentETHPrice()
    );
    createWithdraw(
      event,
      withdrawAmountETH,
      withdrawAmountUSD,
      borrower,
      borrower
    );
  }

  if (newDebt > trove.debt) {
    const borrowAmountLUSD = newDebt.minus(trove.debt);
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountLUSD);
    createBorrow(event, borrowAmountLUSD, borrowAmountUSD, borrower);
  } else if (newDebt < trove.debt) {
    const repayAmountLUSD = trove.debt.minus(newDebt);
    const repayAmountUSD = bigIntToBigDecimal(repayAmountLUSD);
    createRepay(event, repayAmountLUSD, repayAmountUSD, borrower, borrower);
  }

  trove.collateral = newCollateral;
  trove.debt = newDebt;
  trove.save();

  updateUserPositionBalances(event, trove);
}

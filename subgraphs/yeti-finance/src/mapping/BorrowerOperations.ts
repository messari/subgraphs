import {
  YUSDBorrowingFeePaid,
  TroveUpdated,
} from "../../generated/BorrowerOperations/BorrowerOperations";
import {
  createBorrow,
  createDeposit,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove, getOrCreateTroveToken } from "../entities/trove";
import { addProtocolSideRevenue, incrementProtocolWithdrawCount, updateUsageMetrics } from "../entities/protocol";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getUSDPriceWithoutDecimals } from "../utils/price";

/**
 * Emitted when YUSD is borrowed from trove and a dynamic fee (0.5-5%) is charged (added to debt)
 *
 * @param event YUSDBorrowingFeePaid event
 */
export function handleYUSDBorrowingFeePaid(event: YUSDBorrowingFeePaid): void {
  const feeAmountYUSD = event.params._YUSDFee;
  const feeAmountUSD = bigIntToBigDecimal(feeAmountYUSD);
  addProtocolSideRevenue(event, feeAmountUSD);
}

/**
 * Emitted when a trove was updated because of a BorrowerOperation (open/close/adjust)
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const borrower = event.params._borrower;
  const newDebt = event.params._debt;
  const trove = getOrCreateTrove(borrower);

  for (let i = 0; i < event.params._tokens.length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];

    const troveToken = getOrCreateTroveToken(trove, token);

    if (amount == troveToken.collateral && newDebt == trove.debt) {
      continue;
    }
    if (amount > troveToken.collateral) {
      const depositAmount = amount.minus(troveToken.collateral);
      const depositAmountUSD = getUSDPriceWithoutDecimals(
        token,
        depositAmount.toBigDecimal()
      );
      createDeposit(event, depositAmount, depositAmountUSD, borrower, token);
    } else if (amount < troveToken.collateral) {
      const withdrawAmount = troveToken.collateral.minus(amount);
      const withdrawAmountUSD = getUSDPriceWithoutDecimals(
        token,
        withdrawAmount.toBigDecimal()
      );
      createWithdraw(event, withdrawAmount, withdrawAmountUSD, borrower, token);
    }
    troveToken.collateral = amount;
    troveToken.save();
  }

  if (newDebt > trove.debt) {
    const borrowAmountYUSD = newDebt.minus(trove.debt);
    const borrowAmountUSD = bigIntToBigDecimal(borrowAmountYUSD);
    createBorrow(event, borrowAmountYUSD, borrowAmountUSD, borrower);
  } else if (newDebt < trove.debt) {
    const repayAmountYUSD = trove.debt.minus(newDebt);
    const repayAmountUSD = bigIntToBigDecimal(repayAmountYUSD);
    createRepay(event, repayAmountYUSD, repayAmountUSD, borrower);
    
  }

  trove.debt = newDebt;
  trove.save();
  updateUsageMetrics(event, borrower);
  incrementProtocolWithdrawCount(event);

}

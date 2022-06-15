import { TroveUpdated } from "../../generated/TroveManagerLiquidations/TroveManagerLiquidations";

import { Redemption } from "../../generated/TroveManagerRedemptions/TroveManagerRedemptions";
import {
  createBorrow,
  createDeposit,
  createLiquidate,
  createRepay,
  createWithdraw,
} from "../entities/event";
import { getOrCreateTrove, getOrCreateTroveToken } from "../entities/trove";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  LIQUIDATION_FEE,
  LIQUIDATION_RESERVE_YUSD,
} from "../utils/constants";
import { _Trove } from "../../generated/schema";
import {
  addProtocolSideRevenue,
  addSupplySideRevenue,
} from "../entities/protocol";
import { log } from "@graphprotocol/graph-ts";
import { getUSDPriceWithoutDecimals } from "../utils/price";

enum TroveManagerOperation {
  applyPendingRewards,
  liquidateInNormalMode,
  liquidateInRecoveryMode,
  redeemCollateral,
}

export function handleRedemption(event: Redemption): void {
  const feeAmountUSD = event.params.YUSDfee;

  addProtocolSideRevenue(event, feeAmountUSD.toBigDecimal());
}

/**
 * Emitted when a trove was updated because of a TroveManagerOperation operation
 *
 * @param event TroveUpdated event
 */
export function handleTroveUpdated(event: TroveUpdated): void {
  const trove = getOrCreateTrove(event.params._borrower);
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
  for (let i = 0; i < event.params._tokens.length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];
    const troveToken = getOrCreateTroveToken(trove, token);
    troveToken.collateral = amount;
    troveToken.save();
  }
  trove.debt = event.params._debt;
  trove.save();
}

// Treat applyPendingRewards as deposit + borrow
function applyPendingRewards(event: TroveUpdated, trove: _Trove): void {
  const borrower = event.params._borrower;
  const newDebt = event.params._debt;

  for (let i = 0; i < event.params._tokens.toString().length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];

    const troveToken = getOrCreateTroveToken(trove, token);
    const collateralReward = amount.minus(troveToken.collateral);

    const collateralRewardUSD = getUSDPriceWithoutDecimals(
      token,
      amount.toBigDecimal()
    );
    createDeposit(
      event,
      collateralReward,
      collateralRewardUSD,
      borrower,
      token
    );
    troveToken.save();
  }

  const borrowAmountYUSD = newDebt.minus(trove.debt);
  const borrowAmountUSD = bigIntToBigDecimal(borrowAmountYUSD);
  createBorrow(event, borrowAmountYUSD, borrowAmountUSD, borrower);
}

// Treat redeemCollateral as repay + withdraw
function redeemCollateral(event: TroveUpdated, trove: _Trove): void {
  const newDebt = event.params._debt;

  const repayAmountYUSD = trove.debt.minus(newDebt);
  const repayAmountUSD = bigIntToBigDecimal(repayAmountYUSD);
  createRepay(event, repayAmountYUSD, repayAmountUSD, event.transaction.from);

  for (let i = 0; i < event.params._tokens.toString().length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];

    const troveToken = getOrCreateTroveToken(trove, token);
    let withdrawAmount = troveToken.collateral.minus(amount);
    // If trove was closed, then extra collateral is sent to CollSurplusPool to be withdrawn by trove owner
    if (troveToken.collateral.equals(BIGINT_ZERO)) {
      withdrawAmount = withdrawAmount.minus(troveToken.collateralSurplusChange);
      troveToken.collateralSurplusChange = BIGINT_ZERO;
    }
    const withdrawAmountUSD = getUSDPriceWithoutDecimals(
      token,
      amount.toBigDecimal()
    );
    createWithdraw(
      event,
      withdrawAmount,
      withdrawAmountUSD,
      event.transaction.from,
      token
    );
    troveToken.save();
  }
}

function liquidateTrove(event: TroveUpdated, trove: _Trove): void {
  let supplySideRevenueUSD = BIGDECIMAL_ZERO;
  let profit = BIGDECIMAL_ZERO;

  for (let i = 0; i < event.params._tokens.length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];
    const amountUSD = getUSDPriceWithoutDecimals(token, amount.toBigDecimal());
    const profitUSD = amountUSD
      .times(LIQUIDATION_FEE)
      .plus(LIQUIDATION_RESERVE_YUSD);
    createLiquidate(
      event,
      amount,
      amountUSD,
      profitUSD,
      event.transaction.from,
      token
    );
    profit = profit.plus(profitUSD);
    supplySideRevenueUSD = supplySideRevenueUSD.plus(
      amountUSD.times(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
    );
  }
  const liquidatedDebtUSD = bigIntToBigDecimal(trove.debt);
  supplySideRevenueUSD = supplySideRevenueUSD.minus(liquidatedDebtUSD);
  addSupplySideRevenue(event, supplySideRevenueUSD);
  addProtocolSideRevenue(event, profit);
}

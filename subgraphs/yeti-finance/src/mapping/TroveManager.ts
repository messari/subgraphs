import { TroveLiquidated, TroveManagerLiquidations, TroveUpdated } from "../../generated/TroveManagerLiquidations/TroveManagerLiquidations";
import { TroveManager } from "../../generated/TroveManagerLiquidations/TroveManager";

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
  TROVE_MANAGER,
} from "../utils/constants";
import { _Trove, _TroveToken } from "../../generated/schema";
import {
  addProtocolSideRevenue,
  addSupplySideRevenue,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "../entities/protocol";
import { Address, log } from "@graphprotocol/graph-ts";
import { getAsssetsUSD, getUSDPriceWithoutDecimals } from "../utils/price";

enum TroveManagerOperation {
  applyPendingRewards,
  liquidateInNormalMode,
  liquidateInRecoveryMode,
  redeemCollateral,
}

export function handleRedemption(event: Redemption): void {
  const feeAmountUSD = bigIntToBigDecimal(event.params.YUSDfee);
  addProtocolSideRevenue(event, feeAmountUSD);
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

/**
 * Emitted for each trove liquidated during batch liquidation flow, right before TroveUpdated event
 * Used to check for and apply pending rewards, since no event is emitted for this during liquidation
 *
 * @param event TroveLiquidated event
 */
 export function handleTroveLiquidated(event: TroveLiquidated): void {
  const trove = getOrCreateTrove(event.params._borrower);

  const borrower = event.params._borrower;
  const newDebt = event.params._debt;

  if (trove.debt.gt(newDebt)) {
    log.critical(
      "Tracked trove debt was less than actual debt in TroveLiquidated, actual: {}, tracked: {}",
      [trove.debt.toString(), newDebt.toString()]
    );
  }

  if(trove.tokens){
    for (let i = 0; i < trove.tokens!.length; i++) {
      const troveToken = _TroveToken.load(trove.tokens!.at(i))!;
      const tokenAddr = Address.fromString(troveToken.token)
      const amount = troveToken.collateral;
      // Gas compensation already subtracted, only when (MCR <= ICR < TCR & SP.LUSD >= trove.debt)
      if (troveToken.collateral.gt(amount)) {
        // Add gas compensation back to liquidated collateral amount
        troveToken.collateral = troveToken.collateral
          .divDecimal(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE))
          .truncate(0).digits;
      }
      // Apply pending rewards if necessary
      let collateralReward = amount.minus(troveToken.collateral);
      if (troveToken.collateralSurplusChange.gt(BIGINT_ZERO)) {
        collateralReward = collateralReward.plus(
          troveToken.collateralSurplusChange
        );
        troveToken.collateralSurplusChange = BIGINT_ZERO;
      }
      if (collateralReward.gt(BIGINT_ZERO)) {
        const collateralRewardUSD = getUSDPriceWithoutDecimals(tokenAddr, amount.toBigDecimal());
        createDeposit(event, collateralReward, collateralRewardUSD, borrower,tokenAddr);
      }
      const borrowAmountLUSD = newDebt.minus(trove.debt);
      if (borrowAmountLUSD.gt(BIGINT_ZERO)) {
        const borrowAmountUSD = bigIntToBigDecimal(borrowAmountLUSD);
        createBorrow(event, borrowAmountLUSD, borrowAmountUSD, borrower);
      }
      troveToken.collateral = amount;
      troveToken.save()
    }
  }
  
  trove.debt = newDebt;
  trove.save();
  
  updateUsageMetrics(event, borrower);
}

// Treat applyPendingRewards as deposit + borrow
function applyPendingRewards(event: TroveUpdated, trove: _Trove): void {
  const borrower = event.params._borrower;
  const newDebt = event.params._debt;

  for (let i = 0; i < event.params._tokens.length; i++) {
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
  
  updateUsageMetrics(event, borrower);
}

// Treat redeemCollateral as repay + withdraw
function redeemCollateral(event: TroveUpdated, trove: _Trove): void {
  const newDebt = event.params._debt;

  const repayAmountYUSD = trove.debt.minus(newDebt);
  const repayAmountUSD = bigIntToBigDecimal(repayAmountYUSD);
  createRepay(event, repayAmountYUSD, repayAmountUSD, event.transaction.from);

  for (let i = 0; i < event.params._tokens.length; i++) {
    const token = event.params._tokens[i];
    const amount = event.params._amounts[i];

    const troveToken = getOrCreateTroveToken(trove, token);
    let withdrawAmount = troveToken.collateral.minus(amount);
    // If trove was closed, then extra collateral is sent to CollSurplusPool to be withdrawn by trove owner
    if (troveToken.collateral.equals(BIGINT_ZERO)) {
      withdrawAmount = withdrawAmount.minus(troveToken.collateralSurplusChange);
      troveToken.collateralSurplusChange = BIGINT_ZERO;
    }
    if(withdrawAmount.gt(BIGINT_ZERO)){
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
    }
   
    troveToken.save();
  }
  updateUsageMetrics(event, event.transaction.from);
  incrementProtocolWithdrawCount(event);

}

function liquidateTrove(event: TroveUpdated, trove: _Trove): void {
  let supplySideRevenueUSD = BIGDECIMAL_ZERO;
  let profit = BIGDECIMAL_ZERO;
  if(trove.tokens){
    for (let i = 0; i < trove.tokens!.length; i++) {
      const troveToken = _TroveToken.load(trove.tokens!.at(i));
      const tokenAddr = Address.fromString(troveToken!.token)
      const amount = troveToken!.collateral;
      const amountUSD = getUSDPriceWithoutDecimals(tokenAddr, amount.toBigDecimal());
      const profitUSD = amountUSD
        .times(LIQUIDATION_FEE)
        .plus(LIQUIDATION_RESERVE_YUSD);
      createLiquidate(
        event,
        amount,
        amountUSD,
        profitUSD,
        event.transaction.from,
        tokenAddr
      );
      profit = profit.plus(profitUSD);
      supplySideRevenueUSD = supplySideRevenueUSD.plus(
        amountUSD
      );
    }
    const liquidatedDebtUSD = bigIntToBigDecimal(trove.debt);
    supplySideRevenueUSD = supplySideRevenueUSD.times(BIGDECIMAL_ONE.minus(LIQUIDATION_FEE)).minus(liquidatedDebtUSD);
    addSupplySideRevenue(event, supplySideRevenueUSD);
    addProtocolSideRevenue(event, profit);
  }
  updateUsageMetrics(event, event.transaction.from);

}
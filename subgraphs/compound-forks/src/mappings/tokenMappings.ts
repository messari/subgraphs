import { createBorrow, createDeposit, createLiquidation, createRepay, createWithdraw } from "./helpers";
import { Mint, Redeem, Borrow, RepayBorrow, LiquidateBorrow } from "../../generated/templates/cToken/CToken";
import { CToken } from "../../generated/templates";
import { NewReserveFactor } from "../../generated/Comptroller/cToken";
import { updateFinancials, updateMarketMetrics, updateUsageMetrics } from "../common/metrics";
import { getOrCreateLendingProtcol, getOrCreateMarket } from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";
import { Address, dataSource } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ONE, DEFAULT_DECIMALS } from "../common/utils/constants";

export function handleMint(event: Mint): void {
  if (createDeposit(event, event.params.mintAmount, event.params.mintTokens, event.params.minter)) {
    updateUsageMetrics(event, event.params.minter);
    updateFinancials(event);
    updateMarketMetrics(event);
  }
}

export function handleRedeem(event: Redeem): void {
  if (createWithdraw(event, event.params.redeemer, event.params.redeemAmount, event.params.redeemTokens)) {
    updateUsageMetrics(event, event.params.redeemer);
    updateFinancials(event);
    updateMarketMetrics(event);
  }
}

export function handleBorrow(event: Borrow): void {
  if (createBorrow(event, event.params.borrower, event.params.borrowAmount)) {
    updateUsageMetrics(event, event.params.borrower);
    updateFinancials(event);
    updateMarketMetrics(event);
  }
}

export function handleRepayBorrow(event: RepayBorrow): void {
  if (createRepay(event, event.params.payer, event.params.repayAmount)) {
    updateUsageMetrics(event, event.params.payer);
    updateFinancials(event);
    updateMarketMetrics(event);
  }
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  if (
    createLiquidation(
      event,
      event.params.cTokenCollateral,
      event.params.liquidator,
      event.params.seizeTokens,
      event.params.repayAmount,
    )
  ) {
    updateUsageMetrics(event, event.params.liquidator);
    updateFinancials(event);
    updateMarketMetrics(event);
  }
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  let market = getOrCreateMarket(event, event.address);

  // update financials in case the reserve is updated and no other compound transactions happen in that block
  // intended for capturing accurate revenues
  updateFinancials(event);

  // get reserve factor
  market._reserveFactor = event.params.newReserveFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  market.save();
}

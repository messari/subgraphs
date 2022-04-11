import {
  MarketListed,
  NewCollateralFactor,
  NewLiquidationIncentive,
  NewPriceOracle,
} from "../../generated/Comptroller/Comptroller";
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
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  if (createDeposit(event, event.params.mintAmount, event.params.mintTokens, event.params.minter, protocolAddress)) {
    updateUsageMetrics(event, event.params.minter, protocolAddress);
    updateFinancials(event, protocolAddress);
    updateMarketMetrics(event, protocolAddress);
  }
}

export function handleRedeem(event: Redeem): void {
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  if (createWithdraw(event, event.params.redeemer, event.params.redeemAmount, protocolAddress)) {
    updateUsageMetrics(event, event.params.redeemer, protocolAddress);
    updateFinancials(event, protocolAddress);
    updateMarketMetrics(event, protocolAddress);
  }
}

export function handleBorrow(event: Borrow): void {
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  if (createBorrow(event, event.params.borrower, event.params.borrowAmount, protocolAddress)) {
    updateUsageMetrics(event, event.params.borrower, protocolAddress);
    updateFinancials(event, protocolAddress);
    updateMarketMetrics(event, protocolAddress);
  }
}

export function handleRepayBorrow(event: RepayBorrow): void {
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  if (createRepay(event, event.params.payer, event.params.repayAmount, protocolAddress)) {
    updateUsageMetrics(event, event.params.payer, protocolAddress);
    updateFinancials(event, protocolAddress);
    updateMarketMetrics(event, protocolAddress);
  }
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  if (
    createLiquidation(
      event,
      event.params.cTokenCollateral,
      event.params.liquidator,
      event.params.seizeTokens,
      event.params.repayAmount,
      protocolAddress,
    )
  ) {
    updateUsageMetrics(event, event.params.liquidator, protocolAddress);
    updateFinancials(event, protocolAddress);
    updateMarketMetrics(event, protocolAddress);
  }
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const context = dataSource.context();
  const protocolAddress = context.getString("protocolAddress");
  let market = getOrCreateMarket(event, event.address, protocolAddress);

  // update financials in case the reserve is updated and no other compound transactions happen in that block
  // intended for capturing accurate revenues
  updateFinancials(event, protocolAddress);

  // get reserve factor
  market._reserveFactor = event.params.newReserveFactorMantissa
    .toBigDecimal()
    .div(exponentToBigDecimal(DEFAULT_DECIMALS));
  market.save();
}

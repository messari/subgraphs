import { Address } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO } from "./common/constants";

import {
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  AccrueInterest,
} from "../generated/templates/CToken/CErc20";
import {
  createDeposit,
  createWithdraw,
  createBorrow,
  createRepay,
  createLiquidate,
  updateUsageMetrics,
  updateMarket,
  updateMarketMetrics,
  updateFinancials,
  updateFinancialsRevenue,
  updateProtocol,
  updateMarketRates,
} from "./common/helpers";

import { getUnderlyingTokenPricePerAmount } from "./common/getters";

export function handleMint(event: Mint): void {
  let user = event.params.minter;
  createDeposit(event);
  updateMarket(event);
  updateMarketRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  updateFinancials(event);
  updateProtocol(event);
}

export function handleRedeem(event: Redeem): void {
  let user = event.params.redeemer;
  createWithdraw(event);
  updateMarket(event);
  updateMarketRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  updateFinancials(event);
  updateProtocol(event);
}

export function handleBorrow(event: Borrow): void {
  let user = event.params.borrower;
  let borrowAmount = event.params.borrowAmount;
  createBorrow(event);
  updateMarket(event, borrowAmount);
  updateMarketRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  updateFinancials(event);
  updateProtocol(event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  let user = event.params.payer;
  createRepay(event);
  updateMarket(event);
  updateMarketRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  updateFinancials(event);
  updateProtocol(event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  let user = event.params.liquidator;
  createLiquidate(event);
  updateMarket(event);
  updateMarketRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  updateFinancials(event);
  updateProtocol(event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  let interestAccumulated = event.params.interestAccumulated;
  // interest is accounted in underlying token
  let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
  let interestAccumulatedUSD = interestAccumulated
    .toBigDecimal()
    .times(pricePerToken);
  updateFinancialsRevenue(event, BIGDECIMAL_ZERO, interestAccumulatedUSD);
}

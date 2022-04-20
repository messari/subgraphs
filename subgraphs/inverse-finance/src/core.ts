import { log } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, MANTISSA_DECIMALS } from "./common/constants";

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
import { CErc20 } from "../generated/Factory/CErc20";
import { decimalsToBigDecimal } from "./common/utils";

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
  let tokenContract = CErc20.bind(event.address);
  let reserveFactorRes = tokenContract.try_reserveFactorMantissa();
  // reserveFactor = Fraction of interest currently set aside for reserves
  let reserveFactor = BIGDECIMAL_ZERO;
  if (reserveFactorRes.reverted) {
    log.warning(
      "Failed to call reserveFactorMantissa for Market {} at tx hash {}",
      [event.address.toHexString(), event.transaction.hash.toHexString()]
    );
  } else {
    reserveFactor = reserveFactorRes.value
      .toBigDecimal()
      .div(decimalsToBigDecimal(MANTISSA_DECIMALS));
  }

  // interest is accounted in underlying token
  let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
  let interestAccumulatedUSD = interestAccumulated
    .toBigDecimal()
    .times(pricePerToken);
  let protocalRevenueUSD = interestAccumulatedUSD.times(reserveFactor);
  updateFinancialsRevenue(event, protocalRevenueUSD, interestAccumulatedUSD);
}

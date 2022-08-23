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
  updateDeposit,
  updateWithdraw,
  updateBorrow,
  updateRepay,
  updateLiquidate,
  updateUsageMetrics,
  updateMarket,
  updateMarketMetrics,
  updateRevenue,
  aggregateAllMarkets,
  updateInterestRates,
} from "./common/helpers";

import { getUnderlyingTokenPricePerAmount } from "./common/getters";
import { CErc20 } from "../generated/Factory/CErc20";
import { decimalsToBigDecimal } from "./common/utils";

export function handleMint(event: Mint): void {
  let user = event.params.minter;
  updateDeposit(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleRedeem(event: Redeem): void {
  let user = event.params.redeemer;
  updateWithdraw(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleBorrow(event: Borrow): void {
  let user = event.params.borrower;
  updateBorrow(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleRepayBorrow(event: RepayBorrow): void {
  let user = event.params.payer;
  updateRepay(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  let user = event.params.liquidator;
  updateLiquidate(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  let interestAccumulated = event.params.interestAccumulated;
  let tokenContract = CErc20.bind(event.address);
  let reserveFactorRes = tokenContract.try_reserveFactorMantissa();
  // reserveFactor = Fraction of interest currently set aside for reserves
  let reserveFactor = BIGDECIMAL_ZERO;
  if (reserveFactorRes.reverted) {
    log.warning("Failed to call reserveFactorMantissa for Market {} at tx hash {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  } else {
    reserveFactor = reserveFactorRes.value.toBigDecimal().div(decimalsToBigDecimal(MANTISSA_DECIMALS));
  }

  // interest is accounted in underlying token
  let pricePerToken = getUnderlyingTokenPricePerAmount(event.address);
  let interestAccumulatedUSD = interestAccumulated.toBigDecimal().times(pricePerToken);
  let protocalRevenueUSD = interestAccumulatedUSD.times(reserveFactor);
  updateRevenue(event, protocalRevenueUSD, interestAccumulatedUSD);
}

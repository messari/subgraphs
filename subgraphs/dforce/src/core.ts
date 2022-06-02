import { log } from "@graphprotocol/graph-ts";
import { BIGDECIMAL_ZERO, MANTISSA_DECIMALS } from "./common/constants";

import {
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  UpdateInterest,
} from "../generated/templates/iToken/iToken";
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
import { iToken } from "../generated/templates/iToken/iToken";
import { decimalsToBigDecimal } from "./common/utils";
import { Flashloan } from "../generated/templates/iToken/iToken";

export function handleMint(event: Mint): void {
  let user = event.params.sender;
  updateDeposit(event);
  updateMarket(event);
  updateInterestRates(event);
  updateUsageMetrics(event, user);
  updateMarketMetrics(event);
  aggregateAllMarkets(event);
}

export function handleRedeem(event: Redeem): void {
  let user = event.params.recipient;
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

/*
// Not functional as no Flashload event is ever emitted.
// not sure why
export function handleFlashloan(event: Flashloan): void {
  let user = event.params.loaner;
  //? updateMarket(event);
  //updateInterestRates(event);
  updateUsageMetrics(event, user);
  //? updateMarketMetrics(event);
  //? aggregateAllMarkets(event);
  let flashloanFee = event.params.flashloanFee;
  let protocolFee = event.params.protocolFee;
  updateRevenue(event, protocalRevenueUSD, interestAccumulatedUSD);
}
*/

export function handleUpdateInterest(event: UpdateInterest): void {
  let interestAccumulated = event.params.interestAccumulated;
  let tokenContract = iToken.bind(event.address);
  let tryReserveRatio = tokenContract.try_reserveRatio();
  // reserveRatio = Ratio of interest setting aside for reserves (protocol)
  let reserveRatio = BIGDECIMAL_ZERO;
  if (tryReserveRatio.reverted) {
    log.warning("Failed to call reserveRatioMantissa for Market {} at tx hash {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
  } else {
    reserveRatio = tryReserveRatio.value.toBigDecimal().div(decimalsToBigDecimal(MANTISSA_DECIMALS));
  }

  // interest is accounted in underlying token
  let pricePerUnderlyingTokenAmt = getUnderlyingTokenPricePerAmount(event.address);
  let interestAccumulatedUSD = interestAccumulated.toBigDecimal().times(pricePerUnderlyingTokenAmt);
  let protocalRevenueUSD = interestAccumulatedUSD.times(reserveRatio);
  updateRevenue(event, protocalRevenueUSD, interestAccumulatedUSD);
}

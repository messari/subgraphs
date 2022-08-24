import { BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Buy, Sell } from "../generated/Stablizer/Stablizer";
import { updateStablizerFees } from "./common/helpers";

// update revenue from Stablizer for
//    - protocol.cumulativeProtocolSideRevenueUSD
//    - protocol.cumulativeTotalRevenueUSD
//    - FinancialsDailySnapshot.dailyProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.dailyTotalRevenueUSD
//    - FinancialsDailySnapshot.cumulativeTotalRevenueUSD
export function handleSell(event: Sell): void {
  // assume price of DOLA/DAI equal $1
  let fees = event.params.sold.minus(event.params.received).toBigDecimal();
  updateStablizerFees(fees, event);
}

export function handleBuy(event: Buy): void {
  // assume price of DOLA/DAI equal $1
  let fees = event.params.spent.minus(event.params.purchased).toBigDecimal();
  updateStablizerFees(fees, event);
}

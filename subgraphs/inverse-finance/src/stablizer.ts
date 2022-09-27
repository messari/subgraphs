import { Address, BigDecimal, ethereum } from "@graphprotocol/graph-ts";
import { Buy, Sell } from "../generated/Stablizer/Stablizer";
import { DOLA_ADDRESS } from "./common/constants";
import { getOrCreateToken } from "./common/getters";
import { updateStablizerFees } from "./common/helpers";
import { decimalsToBigDecimal } from "./common/utils";

// update revenue from Stablizer for
//    - protocol.cumulativeProtocolSideRevenueUSD
//    - protocol.cumulativeTotalRevenueUSD
//    - FinancialsDailySnapshot.dailyProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.cumulativeProtocolSideRevenueUSD
//    - FinancialsDailySnapshot.dailyTotalRevenueUSD
//    - FinancialsDailySnapshot.cumulativeTotalRevenueUSD
export function handleSell(event: Sell): void {
  // assume price of DOLA/DAI equal $1
  let token = getOrCreateToken(Address.fromString(DOLA_ADDRESS));
  let fees = event.params.sold
    .minus(event.params.received)
    .toBigDecimal()
    .div(decimalsToBigDecimal(token.decimals));
  updateStablizerFees(fees, event);
}

export function handleBuy(event: Buy): void {
  // assume price of DOLA/DAI equal $1
  let token = getOrCreateToken(Address.fromString(DOLA_ADDRESS));
  let fees = event.params.spent
    .minus(event.params.purchased)
    .toBigDecimal()
    .div(decimalsToBigDecimal(token.decimals));
  updateStablizerFees(fees, event);
}

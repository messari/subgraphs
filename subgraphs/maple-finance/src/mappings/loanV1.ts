import { Address } from "@graphprotocol/graph-ts";

import {
    Drawdown as DrawdownEvent,
    PaymentMade as PaymentMadeEvent,
    Liquidation as LiquidationEvent
} from "../../generated/templates/LoanV1/LoanV1";
import { ZERO_BI } from "../common/constants";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";

import { getOrCreateLoan, getOrCreateMarket } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarketDailySnapshot,
    getOrCreateMarketHourlySnapshot
} from "../common/mappingHelpers/getOrCreate/snapshots";
import { createBorrow, createRepay } from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";
import { getTokenAmountInUSD } from "../common/prices/prices";
import { bigDecimalToBigInt } from "../common/utils";

export function handleDrawdown(event: DrawdownEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const drawdownAmount = event.params.drawdownAmount;
    const protocol = getOrCreateProtocol();
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const treasuryFee = bigDecimalToBigInt(drawdownAmount.toBigDecimal().times(protocol._treasuryFee));
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));

    ////
    // Create borrow
    ////
    const borrow = createBorrow(event, loan, drawdownAmount);

    ////
    // Update loan
    ////
    loan.drawnDown = loan.drawnDown.plus(drawdownAmount);
    loan.save();

    ////
    // Update market
    ////
    market._cumulativeTreasuryRevenue = market._cumulativeTreasuryRevenue.plus(treasuryFee);
    const protocolRevenueUSD = getTokenAmountInUSD(event, inputToken, treasuryFee);
    market._cumulativeProtocolSideRevenueUSD = market._cumulativeProtocolSideRevenueUSD.plus(protocolRevenueUSD);
    market.save();

    ////
    // Update protocol
    ////
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueUSD);
    protocol.save();

    ////
    // Update market snapshot
    ////
    const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
    marketDailySnapshot.dailyBorrowUSD = marketDailySnapshot.dailyBorrowUSD.plus(borrow.amountUSD);
    marketDailySnapshot.save();

    const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
    MarketHourlySnapshot.hourlyBorrowUSD = MarketHourlySnapshot.hourlyBorrowUSD.plus(borrow.amountUSD);
    MarketHourlySnapshot.save();

    ////
    // Update financial snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
        getTokenAmountInUSD(event, inputToken, treasuryFee)
    );
    financialsDailySnapshot.dailyBorrowUSD = financialsDailySnapshot.dailyBorrowUSD.plus(borrow.amountUSD);
    financialsDailySnapshot.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    ////
    // Create repay
    ////
    const repay = createRepay(
        event,
        loan,
        event.params.principalPaid,
        event.params.interestPaid,
        ZERO_BI // Treasury establishment fee happens on drawfown for V1 loans
    );

    ////
    // Update loan
    ////
    loan.principalPaid = loan.principalPaid.plus(repay._principalPaid);
    loan.interestPaid = loan.principalPaid.plus(repay._interestPaid);
    loan.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    intervalUpdate(event, market);
}

export function handleLiquidation(event: LiquidationEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    ////
    // Update loan, liqudiation accounted as principal paid
    ////
    loan.principalPaid = loan.principalPaid.plus(
        event.params.liquidityAssetReturned.minus(event.params.liquidationExcess)
    );
    loan.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    intervalUpdate(event, market);
}

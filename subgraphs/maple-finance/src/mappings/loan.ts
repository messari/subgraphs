import { Address } from "@graphprotocol/graph-ts";
import {
    Drawdown as DrawdownEvent,
    PaymentMade as PaymentMadeEvent,
    Liquidation as LiquidationEvent
} from "../../generated/templates/Loan/Loan";
import { getOrCreateLoan } from "../common/mapping_helpers/loan";
import { getOrCreateMarket, marketTick } from "../common/mapping_helpers/market";
import { createBorrow, createLiquidate, createRepay } from "../common/mapping_helpers/transactions";

export function handleDrawdown(event: DrawdownEvent): void {
    const loan = getOrCreateLoan(event.address);
    const drawdownAmount = event.params.drawdownAmount;
    createBorrow(event, loan, drawdownAmount);

    // Update loan
    loan.drawnDown = loan.drawnDown.plus(drawdownAmount);
    loan.save();

    // Trigger market tick
    const market = getOrCreateMarket(Address.fromString(loan.market));
    marketTick(market, event);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event.address);
    createRepay(
        event,
        loan,
        event.params.totalPaid,
        event.params.principalPaid,
        event.params.interestPaid,
        event.params.latePayment
    );

    // Update loan
    loan.principalPaid = loan.principalPaid.plus(event.params.principalPaid);
    loan.interestPaid = loan.principalPaid.plus(event.params.interestPaid);
    loan.save();

    // Trigger market tick
    const market = getOrCreateMarket(Address.fromString(loan.market));
    marketTick(market, event);
}

export function handleLiquidation(event: LiquidationEvent): void {
    const loan = getOrCreateLoan(event.address);
    createLiquidate(
        event,
        loan,
        event.params.liquidityAssetReturned,
        event.params.defaultSuffered,
        event.params.liquidationExcess
    );

    // Update loan
    const collatoralLiquidated = event.params.liquidityAssetReturned.minus(event.params.defaultSuffered);
    loan.collateralLiquidatedInPoolInputTokens = loan.collateralLiquidatedInPoolInputTokens.plus(collatoralLiquidated);
    loan.defaultSuffered = loan.defaultSuffered.plus(event.params.defaultSuffered);
    loan.save();

    // Update market
    const market = getOrCreateMarket(Address.fromString(loan.market));
    market._cumulativeCollatoralLiquidationInPoolInputTokens = market._cumulativeCollatoralLiquidationInPoolInputTokens.plus(
        collatoralLiquidated
    );
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

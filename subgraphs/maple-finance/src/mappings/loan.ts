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
    createBorrow(event, loan, event.params.drawdownAmount);

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

    // Trigger market tick
    const market = getOrCreateMarket(Address.fromString(loan.market));
    marketTick(market, event);
}

import {
    Drawdown as DrawdownEvent,
    PaymentMade as PaymentMadeEvent,
    Liquidation as LiquidationEvent
} from "../../generated/templates/Loan/Loan";
import { getOrCreateMarket } from "../common/mapping_helpers/market";
import { createBorrow, createLiquidate, createRepay } from "../common/mapping_helpers/transactions";

export function handleDrawdown(event: DrawdownEvent): void {
    const market = getOrCreateMarket(event.address);
    createBorrow(event, market, event.params.drawdownAmount);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const market = getOrCreateMarket(event.address);
    createRepay(
        event,
        market,
        event.params.totalPaid,
        event.params.principalPaid,
        event.params.interestPaid,
        event.params.latePayment
    );
}

export function handleLiquidation(event: LiquidationEvent): void {
    const market = getOrCreateMarket(event.address);
    createLiquidate(
        event,
        market,
        event.params.liquidityAssetReturned,
        event.params.defaultSuffered,
        event.params.liquidationExcess
    );
}

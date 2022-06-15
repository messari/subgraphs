import { Address } from "@graphprotocol/graph-ts";

import {
    Drawdown as DrawdownEvent,
    PaymentMade as PaymentMadeEvent,
    Liquidation as LiquidationEvent
} from "../../generated/templates/Loan/Loan";
import { ZERO_BD, ZERO_BI } from "../common/constants";

import { getOrCreateLoan, getOrCreateMarket } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";
import { createBorrow, createLiquidate, createRepay } from "../common/mappingHelpers/getOrCreate/transactions";
import { marketTick } from "../common/mappingHelpers/update/market";
import { bigDecimalToBigInt } from "../common/utils";

export function handleDrawdown(event: DrawdownEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const drawdownAmount = event.params.drawdownAmount;
    createBorrow(event, loan, drawdownAmount);

    // Update loan
    loan.drawnDown = loan.drawnDown.plus(drawdownAmount);
    loan.save();

    // Update market
    const protocol = getOrCreateProtocol();
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    market._treasuryRevenue = market._treasuryRevenue.plus(
        bigDecimalToBigInt(drawdownAmount.toBigDecimal().times(protocol._treasuryFee))
    );
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    createRepay(
        event,
        loan,
        event.params.principalPaid,
        event.params.interestPaid,
        ZERO_BI // Treasury establishment fee happens on drawfown for V1 loans
    );

    // Update loan
    loan.principalPaid = loan.principalPaid.plus(event.params.principalPaid);
    loan.interestPaid = loan.principalPaid.plus(event.params.interestPaid);
    loan.save();

    // Trigger market tick
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    marketTick(market, event);
}

export function handleLiquidation(event: LiquidationEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    // Update loan
    const collatoralLiquidated = event.params.liquidityAssetReturned.minus(event.params.defaultSuffered);
    loan.collateralLiquidatedInPoolInputTokens = loan.collateralLiquidatedInPoolInputTokens.plus(collatoralLiquidated);
    loan.defaultSuffered = loan.defaultSuffered.plus(event.params.defaultSuffered);
    loan.save();

    // Update market
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    market._cumulativeCollatoralLiquidationInPoolInputTokens = market._cumulativeCollatoralLiquidationInPoolInputTokens.plus(
        collatoralLiquidated
    );
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

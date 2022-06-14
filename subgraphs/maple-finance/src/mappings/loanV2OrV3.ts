import { Address } from "@graphprotocol/graph-ts";

import {
    FundsDrawnDown as FundsDrawnDownEvent,
    PaymentMade as PaymentMadeEvent,
    Repossessed as RepossessedEvent
} from "../../generated/templates/LoanV2OrV3/LoanV2OrV3";

import { ZERO_BI } from "../common/constants";
import { getOrCreateLoan, getOrCreateMarket } from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/spawners";
import { createBorrow, createLiquidate, createRepay } from "../common/mappingHelpers/getOrCreate/transactions";
import { marketTick } from "../common/mappingHelpers/update/market";
import { bigDecimalToBigInt } from "../common/utils";

export function handleFundsDrawnDown(event: FundsDrawnDownEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const drawdownAmount = event.params.amount_;
    createBorrow(event, loan, drawdownAmount);

    // Update loan
    loan.drawnDown = loan.drawnDown.plus(drawdownAmount);
    loan.save();

    // Update market
    const protocol = getOrCreateProtocol();
    const market = getOrCreateMarket(event, Address.fromString(loan.market));

    // TODO (spennyp): V3 doesn't work like this?
    market._treasuryRevenue = market._treasuryRevenue.plus(
        bigDecimalToBigInt(drawdownAmount.toBigDecimal().times(protocol._treasuryFee))
    );

    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const principalPaid = event.params.principalPaid_;
    const interestPaid = event.params.interestPaid_;
    createRepay(event, loan, principalPaid.plus(interestPaid), principalPaid, interestPaid, false);

    // Update loan
    loan.principalPaid = loan.principalPaid.plus(principalPaid);
    loan.interestPaid = loan.principalPaid.plus(interestPaid);
    loan.save();

    // Trigger market tick
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    marketTick(market, event);
}

export function handleRepossessed(event: RepossessedEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    // TODO (spennyp): fix this
    createLiquidate(event, loan, ZERO_BI, ZERO_BI, ZERO_BI);

    // Update loan
    // const collatoralLiquidated = event.params.liquidityAssetReturned.minus(event.params.defaultSuffered);
    // loan.collateralLiquidatedInPoolInputTokens = loan.collateralLiquidatedInPoolInputTokens.plus(collatoralLiquidated);
    // loan.defaultSuffered = loan.defaultSuffered.plus(event.params.defaultSuffered);
    // loan.save();

    // // Update market
    // const market = getOrCreateMarket(event, Address.fromString(loan.market));
    // market._cumulativeCollatoralLiquidationInPoolInputTokens = market._cumulativeCollatoralLiquidationInPoolInputTokens.plus(
    //     collatoralLiquidated
    // );
    // market.save();

    // Trigger market tick
    // marketTick(market, event);
}

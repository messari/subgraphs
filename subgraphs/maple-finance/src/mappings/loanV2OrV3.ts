import { Address } from "@graphprotocol/graph-ts";

import {
    FundsDrawnDown as FundsDrawnDownEvent,
    PaymentMade as PaymentMadeEvent,
    Repossessed as RepossessedEvent,
    NewTermsAccepted as NewTermsAcceptedEvent
} from "../../generated/templates/LoanV2OrV3/LoanV2OrV3";
import { LoanV2OrV3 as LoanV2OrV3Contract } from "../../generated/templates/LoanV2OrV3/LoanV2OrV3";

import { ONE_BI, SEC_PER_DAY, ZERO_BI } from "../common/constants";
import {
    getOrCreateInterestRate,
    getOrCreateLoan,
    getOrCreateMarket
} from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";
import { createBorrow, createLiquidate, createRepay } from "../common/mappingHelpers/getOrCreate/transactions";
import { marketTick } from "../common/mappingHelpers/update/market";
import { bigDecimalToBigInt, parseUnits, readCallResult } from "../common/utils";

export function handleNewTermsAccepted(event: NewTermsAcceptedEvent): void {
    // Update loan
    const loan = getOrCreateLoan(event, event.address);
    loan.refinanceCount = loan.refinanceCount.plus(ONE_BI);
    loan.save();

    // Update interest rate
    const interestRate = getOrCreateInterestRate(event, loan);
    const loanV2OrV3Contract = LoanV2OrV3Contract.bind(Address.fromString(loan.id));

    const paymentIntervalSec = readCallResult(
        loanV2OrV3Contract.try_paymentInterval(),
        ZERO_BI,
        loanV2OrV3Contract.try_paymentInterval.name
    );

    const paymentsRemaining = readCallResult(
        loanV2OrV3Contract.try_paymentsRemaining(),
        ZERO_BI,
        loanV2OrV3Contract.try_paymentsRemaining.name
    );

    interestRate.duration = bigDecimalToBigInt(
        paymentIntervalSec
            .times(paymentsRemaining)
            .toBigDecimal()
            .div(SEC_PER_DAY.toBigDecimal())
    );

    // Interst rate for V2/V3 stored as apr in units of 1e18, (i.e. 1% is 0.01e18).
    const rateFromContract = readCallResult(
        loanV2OrV3Contract.try_interestRate(),
        ZERO_BI,
        loanV2OrV3Contract.try_interestRate.name
    );

    const rate = parseUnits(rateFromContract, 18);
    interestRate.rate = rate;
    interestRate.save();
}

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

export function handleRepossessed(event: RepossessedEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    // Update loan, reposession counted towards principal paid
    // TODO (spennyp): what if collatoral is more than owed?
    loan.principalPaid = loan.principalPaid.plus(event.params.fundsRepossessed_);
    loan.save();

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

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const principalPaid = event.params.principalPaid_;
    const interestPaid = event.params.interestPaid_;

    // TODO: V3 has param for treasury fee paid
    createRepay(event, loan, principalPaid, interestPaid, ZERO_BI);

    // Update loan
    loan.principalPaid = loan.principalPaid.plus(principalPaid);
    loan.interestPaid = loan.principalPaid.plus(interestPaid);
    loan.save();

    // Trigger market tick
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    marketTick(market, event);
}

import { Address } from "@graphprotocol/graph-ts";

import {
    FundsDrawnDown as FundsDrawnDownEvent,
    PaymentMade as PaymentMadeEvent,
    Repossessed as RepossessedEvent,
    NewTermsAccepted as NewTermsAcceptedEvent
} from "../../generated/templates/LoanV2/LoanV2";
import { LoanV2 as LoanV2Contract } from "../../generated/templates/LoanV2/LoanV2";

import { ONE_BI, SEC_PER_DAY, ZERO_BI } from "../common/constants";
import {
    getOrCreateInterestRate,
    getOrCreateLoan,
    getOrCreateMarket
} from "../common/mappingHelpers/getOrCreate/markets";
import { getOrCreateProtocol } from "../common/mappingHelpers/getOrCreate/protocol";
import {
    getOrCreateFinancialsDailySnapshot,
    getOrCreateMarketDailySnapshot,
    getOrCreateMarketHourlySnapshot
} from "../common/mappingHelpers/getOrCreate/snapshots";
import { getOrCreateToken } from "../common/mappingHelpers/getOrCreate/supporting";
import { createBorrow, createRepay } from "../common/mappingHelpers/getOrCreate/transactions";
import { intervalUpdate } from "../common/mappingHelpers/update/intervalUpdate";
import { getTokenAmountInUSD } from "../common/prices/prices";
import { bigDecimalToBigInt, minBigInt, parseUnits, readCallResult } from "../common/utils";

export function handleNewTermsAccepted(event: NewTermsAcceptedEvent): void {
    const loan = getOrCreateLoan(event, event.address);

    ////
    // Update loan
    ////
    loan.refinanceCount = loan.refinanceCount.plus(ONE_BI);
    loan.save();

    ////
    // Update interest rate
    ////
    const interestRate = getOrCreateInterestRate(event, loan);
    const loanV2Contract = LoanV2Contract.bind(Address.fromString(loan.id));

    const paymentIntervalSec = readCallResult(
        loanV2Contract.try_paymentInterval(),
        ZERO_BI,
        loanV2Contract.try_paymentInterval.name
    );

    const paymentsRemaining = readCallResult(
        loanV2Contract.try_paymentsRemaining(),
        ZERO_BI,
        loanV2Contract.try_paymentsRemaining.name
    );

    interestRate.duration = bigDecimalToBigInt(
        paymentIntervalSec
            .times(paymentsRemaining)
            .toBigDecimal()
            .div(SEC_PER_DAY.toBigDecimal())
    ).toI32();

    // Interst rate for V2/V3 stored as apr in units of 1e18, (i.e. 1% is 0.01e18).
    const rateFromContract = readCallResult(
        loanV2Contract.try_interestRate(),
        ZERO_BI,
        loanV2Contract.try_interestRate.name
    );

    const rate = parseUnits(rateFromContract, 18);
    interestRate.rate = rate;
    interestRate.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    intervalUpdate(event, market);
}

export function handleFundsDrawnDown(event: FundsDrawnDownEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const drawdownAmount = event.params.amount_;
    const treasuryFeePaid = bigDecimalToBigInt(drawdownAmount.toBigDecimal().times(getOrCreateProtocol()._treasuryFee));

    ////
    // Create borrow
    ////
    const borrow = createBorrow(event, loan, drawdownAmount, treasuryFeePaid);

    ////
    // Update market
    ////
    const protocol = getOrCreateProtocol();
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    const inputToken = getOrCreateToken(Address.fromString(market.inputToken));
    market._cumulativeTreasuryRevenue = market._cumulativeTreasuryRevenue.plus(
        bigDecimalToBigInt(drawdownAmount.toBigDecimal().times(protocol._treasuryFee))
    );
    const protocolRevenueUSD = getTokenAmountInUSD(event, inputToken, treasuryFeePaid);
    market.cumulativeProtocolSideRevenueUSD = market.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueUSD);
    market.save();

    ////
    // Update loan
    ////
    loan.drawnDown = loan.drawnDown.plus(borrow.amount);
    loan.treasuryFeePaid = loan.treasuryFeePaid.plus(treasuryFeePaid);
    loan.save();

    ////
    // Update protocol
    ////
    protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolRevenueUSD);
    protocol.save();

    ////
    // Update financial snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailyProtocolSideRevenueUSD = financialsDailySnapshot.dailyProtocolSideRevenueUSD.plus(
        getTokenAmountInUSD(event, inputToken, treasuryFeePaid)
    );
    financialsDailySnapshot.save();

    ////
    // Update market snapshot
    ////
    const marketDailySnapshot = getOrCreateMarketDailySnapshot(event, market);
    marketDailySnapshot.dailyProtocolSideRevenueUSD = marketDailySnapshot.dailyProtocolSideRevenueUSD.plus(
        protocolRevenueUSD
    );
    marketDailySnapshot.save();

    const MarketHourlySnapshot = getOrCreateMarketHourlySnapshot(event, market);
    MarketHourlySnapshot.hourlyProtocolSideRevenueUSD = MarketHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
        protocolRevenueUSD
    );
    MarketHourlySnapshot.save();

    ////
    // Trigger interval update
    ////
    intervalUpdate(event, market);
}

export function handlePaymentMade(event: PaymentMadeEvent): void {
    const loan = getOrCreateLoan(event, event.address);
    const principalPaid = event.params.principalPaid_;
    const interestPaid = event.params.interestPaid_;

    const repay = createRepay(event, loan, principalPaid, interestPaid, ZERO_BI);

    ////
    // Update loan
    ////
    loan.principalPaid = loan.principalPaid.plus(repay._principalPaid);
    loan.interestPaid = loan.interestPaid.plus(repay._interestPaid);
    loan.save();

    ////
    // Update financial snapshot
    ////
    const financialsDailySnapshot = getOrCreateFinancialsDailySnapshot(event);
    financialsDailySnapshot.dailyRepayUSD = financialsDailySnapshot.dailyRepayUSD.plus(repay.amountUSD);
    financialsDailySnapshot.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    intervalUpdate(event, market);
}

export function handleRepossessed(event: RepossessedEvent): void {
    ////
    // Update loan, reposession counted towards principal paid
    ////
    const loan = getOrCreateLoan(event, event.address);
    loan.principalPaid = minBigInt(loan.drawnDown, loan.principalPaid.plus(event.params.fundsRepossessed_));
    loan.save();

    ////
    // Trigger interval update
    ////
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    intervalUpdate(event, market);
}

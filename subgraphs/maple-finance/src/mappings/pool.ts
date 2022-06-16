import { Address } from "@graphprotocol/graph-ts";

import { LoanV1 as LoanV1Template, LoanV2OrV3 as LoanV2OrV3Template } from "../../generated/templates";
import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent,
    FundsWithdrawn as FundsWithdrawnEvent,
    LossesRecognized as LossesRecognizedEvent
} from "../../generated/templates/Pool/Pool";

import { LoanVersion, PoolState } from "../common/constants";
import {
    getOrCreateAccountMarket,
    getOrCreateLoan,
    getOrCreateMarket,
    getOrCreateStakeLocker
} from "../common/mappingHelpers/getOrCreate/markets";
import { createInterestRate } from "../common/mappingHelpers/getOrCreate/supporting";
import {
    createClaim,
    createDeposit,
    createLiquidate,
    createWithdraw
} from "../common/mappingHelpers/getOrCreate/transactions";
import { marketTick } from "../common/mappingHelpers/update/market";

export function handleLossesRecognized(event: LossesRecognizedEvent): void {
    const market = getOrCreateMarket(event, event.address);
    const accountAddress = event.transaction.from;
    const accountMarket = getOrCreateAccountMarket(event, accountAddress, market);

    accountMarket.unrecognizedLosses = accountMarket.unrecognizedLosses.plus(event.params.lossesRecognized);
    accountMarket.save();
}

export function handleTransfer(event: TransferEvent): void {
    if (Address.zero() == event.params.from) {
        // Deposit (mint)
        const marketAddress = event.address;
        const market = getOrCreateMarket(event, marketAddress);
        const deposit = createDeposit(event, market, event.params.value);

        // Update market
        market.inputTokenBalance = market.inputTokenBalance.plus(deposit.amount);
        market.outputTokenSupply = market.outputTokenSupply.plus(deposit._amountMPT);
        market._cumulativeDeposit = market._cumulativeDeposit.plus(deposit.amount);
        market.save();

        // Trigger market tick
        marketTick(market, event);
    } else if (Address.zero() == event.params.to) {
        // Withdraw (burn)
        const marketAddress = event.address;
        const market = getOrCreateMarket(event, marketAddress);
        const withdraw = createWithdraw(event, market, event.params.value);

        // Update market
        market.inputTokenBalance = market.inputTokenBalance.minus(withdraw.amount);
        market.outputTokenSupply = market.outputTokenSupply.minus(withdraw._amountMPT);
        market.save();

        // Trigger market tick
        marketTick(market, event);
    }
}

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {
    const market = getOrCreateMarket(event, event.address);

    const active = event.params.state == PoolState.Finalized;
    market.isActive = active;
    market.canBorrowFrom = active;
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleLoanFunded(event: LoanFundedEvent): void {
    const loanAddress = event.params.loan;

    // Create loan entity
    const loan = getOrCreateLoan(event, loanAddress, event.address, event.params.amountFunded);

    // Create loan template
    if (LoanVersion.V1 == loan.version) {
        LoanV1Template.create(loanAddress);
    } else {
        LoanV2OrV3Template.create(loanAddress);
    }

    // Add interest rate to market
    createInterestRate(event, loan, loan.interestRate, loan.termDays);

    // Update market
    const market = getOrCreateMarket(event, Address.fromString(loan.market));
    market._totalBorrowBalance = market._totalBorrowBalance.plus(event.params.amountFunded);
    market._cumulativeBorrow = market._cumulativeBorrow.plus(event.params.amountFunded);
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleClaim(event: ClaimEvent): void {
    // Update stake locker
    const market = getOrCreateMarket(event, event.address);
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.revenueInPoolInputTokens = stakeLocker.revenueInPoolInputTokens.plus(event.params.stakeLockerPortion);
    stakeLocker.save();

    // Update market
    market.inputTokenBalance = market.inputTokenBalance.plus(event.params.interest);
    market._totalBorrowBalance = market._totalBorrowBalance.minus(event.params.principal);
    market._poolDelegateRevenue = market._poolDelegateRevenue.plus(event.params.poolDelegatePortion);
    market._supplierRevenue = market._supplierRevenue.plus(event.params.interest);
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleDefaultSuffered(event: DefaultSufferedEvent): void {
    // Create liquidation
    const market = getOrCreateMarket(event, event.address);
    const loan = getOrCreateLoan(event, event.params.loan);
    const defaultSufferedByStakeLocker = event.params.liquidityAssetRecoveredFromBurn;
    const defaultSufferedByPool = event.params.defaultSuffered.minus(defaultSufferedByStakeLocker);
    createLiquidate(event, loan, defaultSufferedByStakeLocker, defaultSufferedByPool);

    // Update stake locker
    const stakeLocker = getOrCreateStakeLocker(event, Address.fromString(market._stakeLocker));
    stakeLocker.stakeTokenBalance = stakeLocker.stakeTokenBalance.minus(event.params.bptsBurned);
    stakeLocker.cumulativeStakeDefault = stakeLocker.cumulativeStakeDefault.plus(event.params.bptsBurned);
    stakeLocker.cumulativeStakeDefaultInPoolInputTokens = stakeLocker.cumulativeStakeDefault.plus(
        event.params.liquidityAssetRecoveredFromBurn
    );
    stakeLocker.save();

    // Update market
    market.inputTokenBalance = market.inputTokenBalance.minus(
        event.params.defaultSuffered.minus(event.params.liquidityAssetRecoveredFromBurn)
    );
    market._totalBorrowBalance = market._totalBorrowBalance.minus(event.params.defaultSuffered);
    market._cumulativePoolDefault = market._cumulativePoolDefault.plus(
        event.params.defaultSuffered.minus(event.params.liquidityAssetRecoveredFromBurn)
    );
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
    // Claim interest
    const marketAddress = event.address;
    const market = getOrCreateMarket(event, marketAddress);
    const claim = createClaim(event, market, event.params.fundsWithdrawn);

    // Update market
    market.inputTokenBalance = market.inputTokenBalance.minus(claim.amount);
    market.save();
}

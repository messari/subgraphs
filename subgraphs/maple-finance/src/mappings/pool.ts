import { Address } from "@graphprotocol/graph-ts";
import { Loan as LoanTemplate } from "../../generated/templates";
import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent
} from "../../generated/templates/Pool/Pool";

import { PoolState } from "../common/constants";
import { getOrCreateMarket, marketTick } from "../common/mapping_helpers/market";
import { createDeposit, createWithdraw } from "../common/mapping_helpers/transactions";
import { getOrCreateLoan } from "../common/mapping_helpers/loan";
import { getOrCreateStakeLocker } from "../common/mapping_helpers/stakeLocker";
import { createInterestRate } from "../common/mapping_helpers/interestRate";

export function handleTransfer(event: TransferEvent): void {
    if (Address.zero() == event.params.from) {
        // Deposit (mint)
        const marketAddress = event.address;
        const market = getOrCreateMarket(marketAddress);
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
        const market = getOrCreateMarket(marketAddress);
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
    const market = getOrCreateMarket(event.address);

    const active = event.params.state == PoolState.Finalized;
    market.isActive = active;
    market.canBorrowFrom = active;
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleLoanFunded(event: LoanFundedEvent): void {
    const loanAddress = event.params.loan;

    // Create loan template
    LoanTemplate.create(loanAddress);

    // Create loan entity
    const loan = getOrCreateLoan(loanAddress, event.address, event.params.amountFunded);

    // Add interest rate to market
    createInterestRate(loan, loan.interestRate, loan.termDays);

    // Update market
    const market = getOrCreateMarket(Address.fromString(loan.market));
    market._totalBorrowBalance = market._totalBorrowBalance.plus(event.params.amountFunded);
    market._cumulativeBorrow = market._cumulativeBorrow.plus(event.params.amountFunded);
    market.save();

    // Trigger market tick
    marketTick(market, event);
}

export function handleClaim(event: ClaimEvent): void {
    // Update stake locker
    const market = getOrCreateMarket(event.address);
    const stakeLocker = getOrCreateStakeLocker(Address.fromString(market._stakeLocker));
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
    // Update stake locker
    const market = getOrCreateMarket(event.address);
    const stakeLocker = getOrCreateStakeLocker(Address.fromString(market._stakeLocker));
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

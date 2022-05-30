import { Address } from "@graphprotocol/graph-ts";
import { Loan as LoanTemplate } from "../../generated/templates";
import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent,
    BalanceUpdated as BalanceUpdatedEvent
} from "../../generated/templates/Pool/Pool";

import { PoolState } from "../common/constants";
import { getOrCreateMarket, marketTick } from "../common/mapping_helpers/market";
import { createDeposit, createWithdraw } from "../common/mapping_helpers/transactions";
import { getOrCreateLoan } from "../common/mapping_helpers/loan";
import { getOrCreateStakeLocker } from "../common/mapping_helpers/stakeLocker";

export function handleTransfer(event: TransferEvent): void {
    if (Address.zero() == event.params.from) {
        // Deposit (mint)
        const marketAddress = event.address;
        const market = getOrCreateMarket(marketAddress);
        createDeposit(event, market, event.params.value);

        // Trigger market tick
        marketTick(market, event);
    } else if (Address.zero() == event.params.to) {
        // Withdraw (burn)
        const marketAddress = event.address;
        const market = getOrCreateMarket(marketAddress);
        createWithdraw(event, market, event.params.value);

        // Trigger market tick
        marketTick(market, event);
    }
}

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {
    const market = getOrCreateMarket(event.address);

    const active = event.params.state == PoolState.Finalized;
    market.isActive = active;
    market.canBorrowFrom = active;

    // Trigger market tick
    marketTick(market, event);
}

export function handleLoanFunded(event: LoanFundedEvent): void {
    const loanAddress = event.params.loan;

    // Create loan template
    LoanTemplate.create(loanAddress);

    // Create loan entity
    const loan = getOrCreateLoan(loanAddress, event.address, event.params.amountFunded);

    // Trigger market tick
    const market = getOrCreateMarket(Address.fromString(loan.market));
    marketTick(market, event);
}

export function handleClaim(event: ClaimEvent): void {
    // Update stake locker
    const market = getOrCreateMarket(event.address);
    const stakeLocker = getOrCreateStakeLocker(Address.fromString(market._stakeLocker));
    stakeLocker.revenueInPoolInputTokens = stakeLocker.revenueInPoolInputTokens.plus(event.params.stakeLockerPortion);
    stakeLocker.save();

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

    // Trigger market tick
    marketTick(market, event);
}

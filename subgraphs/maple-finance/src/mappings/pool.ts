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
import { getOrCreateMarket } from "../common/mapping_helpers/market";
import { createDeposit, createWithdraw } from "../common/mapping_helpers/transactions";
import { getOrCreateLoan } from "../common/mapping_helpers/loan";

export function handleTransfer(event: TransferEvent): void {
    if (Address.zero() == event.params.from) {
        // Deposit (mint)
        const marketAddress = event.address;
        const market = getOrCreateMarket(marketAddress);
        createDeposit(event, market, event.params.value);
    } else if (Address.zero() == event.params.to) {
        // Withdraw (burn)
        const marketAddress = event.address;
        const market = getOrCreateMarket(marketAddress);
        createWithdraw(event, market, event.params.value);
    }
}

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {
    const market = getOrCreateMarket(event.address);

    const active = event.params.state == PoolState.Finalized;
    market.isActive = active;
    market.canBorrowFrom = active;
}

export function handleLoanFunded(event: LoanFundedEvent): void {
    const loanAddress = event.params.loan;

    // Create loan template
    LoanTemplate.create(loanAddress);

    // Create loan entity
    getOrCreateLoan(loanAddress, event.address, event.params.amountFunded);
}

export function handleClaim(event: ClaimEvent): void {}

export function handleDefaultSuffered(event: DefaultSufferedEvent): void {}

export function handleBalanceUpdated(event: BalanceUpdatedEvent): void {}

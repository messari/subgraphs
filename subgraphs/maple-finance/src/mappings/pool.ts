import { Address, BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";

import {
    PoolStateChanged as PoolStateChangedEvent,
    LoanFunded as LoanFundedEvent,
    Transfer as TransferEvent,
    Claim as ClaimEvent,
    DefaultSuffered as DefaultSufferedEvent,
    BalanceUpdated as BalanceUpdatedEvent
} from "../../generated/templates/Pool/Pool";
import { Deposit, Withdraw } from "../../generated/schema";
import { PROTOCOL_ID } from "../common/constants";
import { getOrCreateMarket } from "../common/mapping_helpers/market";
import { createDeposit, createWithdraw } from "../common/mapping_helpers/transactions";

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {}

export function handleLoanFunded(event: LoanFundedEvent): void {}

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

export function handleClaim(event: ClaimEvent): void {}

export function handleDefaultSuffered(event: DefaultSufferedEvent): void {}

export function handleBalanceUpdated(event: BalanceUpdatedEvent): void {}

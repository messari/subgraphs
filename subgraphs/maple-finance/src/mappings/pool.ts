import {
  PoolStateChanged as PoolStateChangedEvent,
  LoanFunded as LoanFundedEvent,
  Transfer as TransferEvent,
  Claim as ClaimEvent,
  DefaultSuffered as DefaultSufferedEvent,
  BalanceUpdated as BalanceUpdatedEvent
} from "../../generated/templates/Pool/Pool";

export function handlePoolStateChanged(event: PoolStateChangedEvent): void {}

export function handleLoanFunded(event: LoanFundedEvent): void {}

export function handleTransfer(event: TransferEvent): void {}

export function handleClaim(event: ClaimEvent): void {}

export function handleDefaultSuffered(event: DefaultSufferedEvent): void {}

export function handleBalanceUpdated(event: BalanceUpdatedEvent): void {}

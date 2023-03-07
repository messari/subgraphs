import {
  DisputerUpdated as DisputerUpdatedEvent,
  ExpiryPriceDisputed as ExpiryPriceDisputedEvent,
  ExpiryPriceUpdated as ExpiryPriceUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  PricerDisputePeriodUpdated as PricerDisputePeriodUpdatedEvent,
  PricerLockingPeriodUpdated as PricerLockingPeriodUpdatedEvent,
  PricerUpdated as PricerUpdatedEvent,
  StablePriceUpdated as StablePriceUpdatedEvent,
} from "../../generated/Oracle/Oracle";

export function handleDisputerUpdated(event: DisputerUpdatedEvent): void {}

export function handleExpiryPriceDisputed(
  event: ExpiryPriceDisputedEvent
): void {
  // contracts expired, overwrite price
}

export function handleExpiryPriceUpdated(event: ExpiryPriceUpdatedEvent): void {
  // contracts expired
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {}

export function handlePricerDisputePeriodUpdated(
  event: PricerDisputePeriodUpdatedEvent
): void {}

export function handlePricerLockingPeriodUpdated(
  event: PricerLockingPeriodUpdatedEvent
): void {}

export function handlePricerUpdated(event: PricerUpdatedEvent): void {}

export function handleStablePriceUpdated(
  event: StablePriceUpdatedEvent
): void {}

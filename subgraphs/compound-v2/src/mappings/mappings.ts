// map blockchain data to entities outlined in schema.graphql

import { BigInt } from "@graphprotocol/graph-ts"
import {
  AccrueInterest,
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  NewPendingAdmin,
  NewAdmin,
  NewComptroller,
  NewMarketInterestRateModel,
  NewReserveFactor,
  ReservesReduced,
  Failure,
  Transfer,
  Approval
} from "../types/cCOMP/cToken"
import { Deposit, Token } from "../types/schema"

// TODO: remove
let counter = 0

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.


export function handleMint(event: Mint): void {}

export function handleRedeem(event: Redeem): void {}

export function handleBorrow(event: Borrow): void {}

export function handleRepayBorrow(event: RepayBorrow): void {}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {}

export function handleNewPendingAdmin(event: NewPendingAdmin): void {}

export function handleNewAdmin(event: NewAdmin): void {}

export function handleNewComptroller(event: NewComptroller): void {}

export function handleNewMarketInterestRateModel(
  event: NewMarketInterestRateModel
): void {}

export function handleNewReserveFactor(event: NewReserveFactor): void {}

export function handleReservesReduced(event: ReservesReduced): void {}

export function handleFailure(event: Failure): void {}

export function handleTransfer(event: Transfer): void {
  let deposit = new Deposit(counter.toString())
  deposit.from = event.params.from.toHex().toString()
  counter++
  deposit.save()
}

export function handleApproval(event: Approval): void {}

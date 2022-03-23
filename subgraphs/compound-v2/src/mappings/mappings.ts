// map blockchain data to entities outlined in schema.graphql

import { BigInt } from "@graphprotocol/graph-ts"
import { DEFAULT_DECIMALS } from "../common/constants"
import {
  Mint,
  Redeem,
  Borrow,
  RepayBorrow,
  LiquidateBorrow,
  NewComptroller, // comptroller update
} from "../types/cCOMP/cToken"

import { 
  Token,
  LendingProtocol,
  Market,
  Deposit,
  Withdraw,
  Borrow1,
  Repay,
  Liquidation
  } from "../types/schema"

// TODO: remove
let counter = 0

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.


export function handleMint(event: Mint): void {
  let transactionHash = event.transaction.hash.toHexString()
  let logIndex = event.logIndex
  let id = transactionHash + '-' + logIndex.toString()

  // create new Deposit
  let deposit = new Deposit(id)

  // fill in deposit numbers
  deposit.hash = transactionHash
  deposit.logIndex = logIndex.toI32()
  // TODO: check if protocol exists else make protocol in helpers
  // deposit.protocol =
  // TODO: is this good practice? Otherwise will need to use transfers instead or use just for to addr
  // let toAddress = event.transaction.to?.toString() 
  // if (toAddress !== null)
  //   deposit.to = toAddress
  // else
  //   deposit.to = ""

  deposit.from = event.params.minter.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  // TODO check if market exists if not make it
  // deposit.market =
  // TODO check if token exists if not make it
  // deposit.token = 
  deposit.amount = event.params.mintAmount.toBigDecimal()
  // TODO get usd price
  // https://github.com/compound-finance/compound-v2-subgraph/blob/master/src/mappings/markets.ts#L26
  // https://github.com/compound-finance/compound-v2-subgraph/blob/master/src/mappings/markets.ts#L80

  deposit.save()
}

export function handleRedeem(event: Redeem): void {}

export function handleBorrow(event: Borrow): void {}

export function handleRepayBorrow(event: RepayBorrow): void {}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {}

export function handleNewComptroller(event: NewComptroller): void {}

// export function handleTransfer(event: Transfer): void {
//   let deposit = new Deposit(counter.toString())
//   deposit.from = event.params.from.toHex().toString()
//   counter++
  
//   deposit.save()
// }

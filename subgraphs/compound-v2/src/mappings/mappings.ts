// map blockchain data to entities outlined in schema.graphql

import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { 
  DEFAULT_DECIMALS,
  COMPOUND_DECIMALS 
} from "../common/constants"
import { 
  createLendingProtocol,
  getTokenPrice
} from "./helpers"
import {
  Mint,
  Redeem,
  Borrow as BorrowEvent,
  RepayBorrow,
  LiquidateBorrow,
  NewComptroller, // comptroller update
} from "../types/cCOMP/cToken"

import {
  NewPriceOracle
} from "../types/Comptroller/Comptroller"

import { 
  Token,
  LendingProtocol,
  Market,
  Deposit,
  Withdraw,
  Borrow as BorrowEntity,
  Repay,
  Liquidation
  } from "../types/schema"

  import {
    COMPTROLLER_ADDRESS,
    ADDRESS_ZERO
  } from "../common/addresses"

  import {
    NETWORK_ETHEREUM,
    PROTOCOL_TYPE_LENDING,
    PROTOCOL_NAME,
    PROTOCOL_SLUG,
    PROTOCOL_VERSION
  } from "../common/constants"

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

  // get reused vars
  let marketAddress = event.transaction.to as Address
  let blockNumber = event.block.number

  // fill in deposit numbers
  deposit.hash = transactionHash
  deposit.logIndex = logIndex.toI32()
  deposit.protocol = COMPTROLLER_ADDRESS.toHexString()
  deposit.to = marketAddress.toHexString()
  deposit.from = event.params.minter.toHexString()
  deposit.blockNumber = blockNumber
  deposit.timestamp = event.block.timestamp
  deposit.market = marketAddress.toHexString()
  deposit.asset = marketAddress.toHexString() // TODO: it should be the cToken
  deposit.amount = event.params.mintAmount // TODO: change to actual amount not 8000000...00

  // get usdPrice
  let usdPrice = getTokenPrice(
    blockNumber.toI32(), 
    event.address, 
    marketAddress, 
    COMPOUND_DECIMALS
  )
  deposit.amountUSD = usdPrice

  deposit.save()
}

export function handleRedeem(event: Redeem): void {}

export function handleBorrow(event: BorrowEvent): void {}

export function handleRepayBorrow(event: RepayBorrow): void {}

export function handleLiquidateBorrow(event: LiquidateBorrow): void {}

export function handleNewComptroller(event: NewComptroller): void {}

// export function handleTransfer(event: Transfer): void {
//   let deposit = new Deposit()
//   deposit.from = event.params.from.toHex().toString()
//   counter++
  
//   deposit.save()
// }

export function handleNewPriceOracle(event: NewPriceOracle): void {
  // create LendingProtocol - first function to be called in Comptroller
  let lendingProtocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())
  if (lendingProtocol == null) {
    lendingProtocol = createLendingProtocol()
  }
  lendingProtocol._priceOracle = event.params.newPriceOracle
  lendingProtocol.save()
}

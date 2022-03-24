// map blockchain data to entities outlined in schema.graphql

import { BigInt } from "@graphprotocol/graph-ts"
import { DEFAULT_DECIMALS } from "../common/constants"
import { 
  createLendingProtocol,
  findMarketAddress 
} from "./helpers"
import {
  Mint,
  Redeem,
  Borrow,
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
  Borrow1,
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
  let marketAddress = findMarketAddress(event.transaction.to).toHexString()

  // fill in deposit numbers
  deposit.hash = transactionHash
  deposit.logIndex = logIndex.toI32()
  deposit.protocol = COMPTROLLER_ADDRESS.toHexString()
  deposit.to = marketAddress
  deposit.from = event.params.minter.toHexString()
  deposit.blockNumber = event.block.number
  deposit.timestamp = event.block.timestamp
  deposit.market = marketAddress
  // TODO check if token exists if not make it
  // create a mapping between cToken to token address
  // deposit.token = 
  event.transaction.input

  // TODO: change to actual amount not 8000000...00
  deposit.amount = event.params.mintAmount
  // TODO get usd price
  // https://github.com/compound-finance/compound-v2-subgraph/blob/master/src/mappings/markets.ts#L26
  // https://github.com/compound-finance/compound-v2-subgraph/blob/master/src/mappings/markets.ts#L80

  // TODO add metrics for snapshots (maybe put this in handleTransfer to minimize calls)
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

export function handleNewPriceOracle(event: NewPriceOracle): void {
  // create LendingProtocol - first function to be called in Comptroller
  let lendingProtocol = LendingProtocol.load(COMPTROLLER_ADDRESS.toHexString())
  if (lendingProtocol == null) {
    lendingProtocol = new LendingProtocol(COMPTROLLER_ADDRESS.toHexString())
    lendingProtocol.name = PROTOCOL_NAME
    lendingProtocol.slug = PROTOCOL_SLUG
    lendingProtocol.version = PROTOCOL_VERSION
    lendingProtocol.network = NETWORK_ETHEREUM
    lendingProtocol.type = PROTOCOL_TYPE_LENDING

    // create empty lists that will be populated each day
    lendingProtocol.usageMetrics = []
    lendingProtocol.financialMetrics = []
  }
  lendingProtocol._priceOracle = event.params.newPriceOracle
  lendingProtocol.save()
}

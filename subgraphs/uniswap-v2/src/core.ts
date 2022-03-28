// import { log } from '@graphprotocol/graph-ts'
import {
  _HelperStore,
  _TokenTracker
} from './../generated/schema'

import { Mint, Burn, Swap, Transfer, Sync } from '../generated/templates/Pair/Pair'
import {
  updateInputTokenBalances,
  updateTvlAndTokenPrices,
  handleTransferMint,
  handleTransferToPoolBurn,
  handleTransferBurn,
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees
} from './common/helpers'

import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics,
} from './common/intervalUpdates'

import {
  BIGINT_THOUSAND,
  ZERO_ADDRESS,
} from './common/constants'

export function handleTransfer(event: Transfer): void {


  // ignore initial transfers for first adds
  if (event.params.to.toHexString() == ZERO_ADDRESS && event.params.value.equals(BIGINT_THOUSAND)) {
    return
  }

  // mints
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleTransferMint(event, event.params.value, event.params.to)  
  } 
  // Case where direct send first on ETH withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  // This gets the EOA that made the burn loaded into the _Transfer.
  if (event.params.to == event.address) {
    handleTransferToPoolBurn(event, event.params.value, event.params.from)
  }

  // burn
  if (event.params.to.toHexString() == ZERO_ADDRESS && event.params.from == event.address) {
    handleTransferBurn(event, event.params.value, event.params.from)
  }
}

export function handleSync(event: Sync): void {
  updateInputTokenBalances(event.address.toHexString(), event.params.reserve0, event.params.reserve1)
  updateTvlAndTokenPrices(event.address.toHexString())
}

export function handleMint(event: Mint): void {
  createDeposit(event, event.params.amount0, event.params.amount1, event.params.sender)
  updateUsageMetrics(event, event.params.sender)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleBurn(event: Burn): void {
  createWithdraw(event, event.params.amount0, event.params.amount1, event.params.sender, event.params.to)
  updateUsageMetrics(event, event.transaction.from)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleSwap(event: Swap): void {
  createSwapHandleVolumeAndFees(event, event.params.to, event.params.sender, event.params.amount0In, event.params.amount1In, event.params.amount0Out, event.params.amount1Out)
  updateFinancials(event)
  updatePoolMetrics(event)
  updateUsageMetrics(event, event.transaction.from)
}
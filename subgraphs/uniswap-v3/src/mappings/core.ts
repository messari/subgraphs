// import { log } from '@graphprotocol/graph-ts'
import {
  Burn as BurnEvent,
  Initialize,
  Mint as MintEvent,
  Swap as SwapEvent
} from '../../generated/templates/Pool/Pool'
import {
  updatePrices,
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees
} from '../common/helpers'
import { updateFinancials, updatePoolMetrics, updateUsageMetrics } from '../common/intervalUpdates'

export function handleInitialize(event: Initialize): void {
  updatePrices(event)
  updatePoolMetrics(event)
}


export function handleMint(event: MintEvent): void {
  createDeposit(event, event.params.owner, event.params.amount0, event.params.amount1, event.params.amount)
  updateUsageMetrics(event, event.params.owner)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleBurn(event: BurnEvent): void {
  createWithdraw(event, event.params.owner, event.params.amount0, event.params.amount1, event.params.amount)
  updateUsageMetrics(event, event.params.owner)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleSwap(event: SwapEvent): void {
  createSwapHandleVolumeAndFees(event, event.params.amount0, event.params.amount1, event.params.recipient, event.params.sender)
  updateFinancials(event)
  updatePoolMetrics(event)
  updateUsageMetrics(event, event.params.sender)
}

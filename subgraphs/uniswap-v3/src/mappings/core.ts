// import { log } from '@graphprotocol/graph-ts'
import {
  Burn as BurnEvent,
  Initialize,
  Mint as MintEvent,
  Swap as SwapEvent,
  SetFeeProtocol
} from '../../generated/templates/Pool/Pool'
import {
  updatePrices,
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees,
  updateProtocolFees
} from '../common/helpers'
import { updateFinancials, updatePoolMetrics, updateUsageMetrics } from '../common/intervalUpdates'

export function handleInitialize(event: Initialize): void {
  updatePrices(event)
  updatePoolMetrics(event)
}

export function handleSetFeeProtocol(event: SetFeeProtocol): void {
  updateProtocolFees(event)
}

export function handleMint(event: MintEvent): void {
  createDeposit(event, event.params.amount0, event.params.amount1)
  updateUsageMetrics(event, event.params.sender)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleBurn(event: BurnEvent): void {
  createWithdraw(event, event.params.amount0, event.params.amount1)
  updateUsageMetrics(event, event.transaction.from)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleSwap(event: SwapEvent): void {
  createSwapHandleVolumeAndFees(event, event.params.amount0, event.params.amount1, event.params.recipient, event.params.sender)
  updateFinancials(event)
  updatePoolMetrics(event)
  updateUsageMetrics(event, event.transaction.from)
}

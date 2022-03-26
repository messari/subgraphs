import { log } from '@graphprotocol/graph-ts'
import { Mint, Burn, Swap } from '../../generated/templates/Pair/Pair'
import { PairCreated } from '../../generated/templates/Pair/Factory'
import {
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees,
  createLiquidityPool,
} from './helpers'
import {
  updateFinancials,
  updateUsageMetrics,
  updatePoolMetrics,
} from '../common/metrics'
import { getOrCreateDexAmm } from '../common/getters'

// To improve readability and consistency, it is recommended that you put all
// handlers in this file, and create helper functions to handle specific events

export function handleNewPair(event: PairCreated): void {
  // let protocol = getOrCreateDexAmm()

  // // create the tokens and tokentracker
  // let token0 = getOrCreateToken(event.params.token0)
  // let token1 = getOrCreateToken(event.params.token1)
  // let LPtoken = getOrCreateToken(event.params.pair)

  // let tokenTracker0 = getOrCreateTokenTracker(event.params.token0)
  // let tokenTracker1 = getOrCreateTokenTracker(event.params.token1)

  // tokenTracker0.derivedETH = findEthPerToken(tokenTracker0)
  // tokenTracker1.derivedETH = findEthPerToken(tokenTracker1)

  // createLiquidityPool(event, protocol, event.params.pair, token0, token1, LPtoken)
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
  updateUsageMetrics(event, event.params.sender)
}

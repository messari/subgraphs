
import { log } from '@graphprotocol/graph-ts'
import {
  _HelperStore,
  _TokenTracker
} from '../../generated/schema'
import { Mint, Burn, Swap, Transfer, Sync } from '../../generated/templates/Pair/Pair'
import {
  createDeposit,
  createWithdraw,
  createSwapHandleVolumeAndFees
} from '../common/creators'
import { handleTransferBurn, handleTransferMint, handleTransferToPoolBurn } from '../common/handlers'
import { updateFinancials, updateInputTokenBalances, updatePoolMetrics, updateTvlAndTokenPrices, updateUsageMetrics } from '../common/updateMetrics'
import {
  BIGINT_THOUSAND,
  ZERO_ADDRESS,
} from '../common/constants'

export function handleTransfer(event: Transfer): void {

  // ignore initial transfers for first adds
  if (event.params.to == ZERO_ADDRESS && event.params.value.equals(BIGINT_THOUSAND)) {
    return
  }

  // mints
  if (event.params.from == ZERO_ADDRESS) {
    handleTransferMint(event, event.params.value, event.params.to)  
  } 
  // Case where direct send first on ETH withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  // This gets the EOA that made the burn loaded into the _Transfer.

  if (event.params.to == event.address) {
    handleTransferToPoolBurn(event, event.params.value, event.params.from)
  }

  // burn
  if (event.params.to == ZERO_ADDRESS && event.params.from == event.address) {
    handleTransferBurn(event, event.params.value, event.params.from)
  }

}

export function handleSync(event: Sync): void {
  updateInputTokenBalances(event.address, event.params.reserve0, event.params.reserve1)
  updateTvlAndTokenPrices(event.address, event.block.number)
}

export function handleMint(event: Mint): void {
  createDeposit(event, event.params.amount0, event.params.amount1)
  updateUsageMetrics(event, event.params.sender)
  updateFinancials(event)
  updatePoolMetrics(event)
}

export function handleBurn(event: Burn): void {
  createWithdraw(event, event.params.amount0, event.params.amount1)  
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
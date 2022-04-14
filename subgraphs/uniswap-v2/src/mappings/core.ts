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

  log.warning("Hel", [])


  // ignore initial transfers for first adds
  if (event.params.to == ZERO_ADDRESS && event.params.value.equals(BIGINT_THOUSAND)) {
    return
  }
  log.warning("Hel1", [])

  // mints
  if (event.params.from == ZERO_ADDRESS) {
    handleTransferMint(event, event.params.value, event.params.to)  
  } 
  // Case where direct send first on ETH withdrawls.
  // For burns, mint tokens are first transferred to the pool before transferred for burn.
  // This gets the EOA that made the burn loaded into the _Transfer.
  log.warning("Hel2", [])

  if (event.params.to == event.address) {
    handleTransferToPoolBurn(event, event.params.value, event.params.from)
  }
  log.warning("Hel3", [])

  // burn
  if (event.params.to == ZERO_ADDRESS && event.params.from == event.address) {
    handleTransferBurn(event, event.params.value, event.params.from)
  }
  log.warning("Hel4", [])

}

export function handleSync(event: Sync): void {
  log.warning("Hello", [])
  updateInputTokenBalances(event.address, event.params.reserve0, event.params.reserve1)
  log.warning("Hello1", [])
  updateTvlAndTokenPrices(event.address)
  log.warning("Hello2", [])

}

export function handleMint(event: Mint): void {
  log.warning("Hello3", [])

  createDeposit(event, event.params.amount0, event.params.amount1)
  log.warning("Hello4", [])

  updateUsageMetrics(event, event.params.sender)
  log.warning("Hello5", [])

  updateFinancials(event)
  log.warning("Hello6", [])

  updatePoolMetrics(event)
  log.warning("Hello7", [])

}

export function handleBurn(event: Burn): void {
  log.warning("Hello8", [])

  createWithdraw(event, event.params.amount0, event.params.amount1)  
  log.warning("Hello9", [])

  updateUsageMetrics(event, event.transaction.from)
  log.warning("Hello10", [])

  updateFinancials(event)
  log.warning("Hello11", [])

  updatePoolMetrics(event)
  log.warning("Hello12", [])

}

export function handleSwap(event: Swap): void {
  createSwapHandleVolumeAndFees(event, event.params.to, event.params.sender, event.params.amount0In, event.params.amount1In, event.params.amount0Out, event.params.amount1Out)
  log.warning("Hello13", [])

  updateFinancials(event)
  log.warning("Hello14", [])

  updatePoolMetrics(event)
  log.warning("Hello15", [])

  updateUsageMetrics(event, event.transaction.from)
  log.warning("Hello16", [])

}
import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog,
} from '../generated/Controller/ControllerContract'
import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { vaults } from './utils/vaults'
import { Token, Vault } from '../generated/schema'
import { prices } from './utils/prices'
import { decimals } from './utils'
import { protocols } from './utils/protocols'
import { metrics } from './utils/metrics'

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vaultAddress = call.inputs._vault

  let timestamp = call.block.timestamp
  let blockNumber = call.block.number

  vaults.createVault(vaultAddress, timestamp, blockNumber)
}

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault
  let vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  const inputToken = Token.load(vault.inputToken)

  if (!inputToken) return

  const priceUsd = prices.getPricePerToken(Address.fromString(vault.inputToken))

  inputToken.lastPriceUSD = priceUsd
  inputToken.lastPriceBlockNumber = event.block.number

  inputToken.save()

  const newInputTokenBalance = vaults.extractInputTokenBalance(vaultAddress)

  if (!newInputTokenBalance) return

  vault.pricePerShare = decimals.fromBigInt(
    event.params.newSharePrice,
    inputToken.decimals as u8
  )

  vault.totalValueLockedUSD = decimals
    .fromBigInt(newInputTokenBalance, inputToken.decimals as u8)
    .times(priceUsd)

  vault.inputTokenBalance = newInputTokenBalance
  vault.save()

  const oldSharePrice = event.params.oldSharePrice
  const newSharePrice = event.params.newSharePrice

  const supplyAuxProfit = newSharePrice.minus(oldSharePrice)

  let supplySideProfit: BigDecimal
  let totalProfit: BigDecimal
  let profitAmountUSD: BigDecimal
  let feeAmountUSD: BigDecimal

  if (supplyAuxProfit <= BigInt.fromI32(0)) {
    supplySideProfit = BigDecimal.fromString('0')
    totalProfit = BigDecimal.fromString('0')
    profitAmountUSD = BigDecimal.fromString('0')
    feeAmountUSD = BigDecimal.fromString('0')
  } else {
    const auxSupplySideProfit = supplyAuxProfit
      .times(vault.outputTokenSupply!)
      .div(BigInt.fromI32(10).pow(inputToken.decimals as u8))

    supplySideProfit = decimals.fromBigInt(
      auxSupplySideProfit,
      inputToken.decimals as u8
    )

    totalProfit = supplySideProfit
      .times(BigDecimal.fromString('100'))
      .div(BigDecimal.fromString('70'))

    profitAmountUSD = prices.getPrice(
      Address.fromString(inputToken.id),
      totalProfit
    )

    feeAmountUSD = prices.getPrice(
      Address.fromString(inputToken.id),
      totalProfit.minus(supplySideProfit)
    )
  }

  vaults.updateRevenue(
    vaultAddress.toHexString(),
    profitAmountUSD,
    feeAmountUSD
  )

  metrics.updateVaultSnapshotsAfterRevenue(
    vaultAddress.toHexString(),
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )

  metrics.updateFinancialsAfterRevenue(
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )

  metrics.updateVaultSnapshots(vaultAddress, event.block)
  metrics.updateFinancials(event.block)

  protocols.updateRevenue(vault.protocol, profitAmountUSD, feeAmountUSD)
  protocols.updateTotalValueLockedUSD(vault.protocol)
}

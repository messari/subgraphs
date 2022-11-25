import { ProfitLogInReward as ProfitLogInRewardEvent } from '../generated/templates/Strategy/Strategy'
import { Vault, Token } from '../generated/schema'
import { strategies } from './utils/strategies'
import { Address, log } from '@graphprotocol/graph-ts'
import { decimals } from './utils'
import { prices } from './utils/prices'
import { metrics } from './utils/metrics'
import { vaults } from './utils/vaults'
import { protocols } from './utils/protocols'

export function handleProfitLogInReward(event: ProfitLogInRewardEvent): void {
  const strategy = strategies.getOrCreateStrategy(event.address)

  const vaultAddress = strategy.vault

  if (!vaultAddress) {
    log.debug('Vault address not found for strategy {}', [
      event.address.toHexString(),
    ])
    return
  }

  const vault = Vault.load(vaultAddress!)

  if (!vault) {
    log.debug('Vault entity not found for strategy: {}', [
      event.address.toHexString(),
    ])
    return
  }

  const tokenAddress = vault.inputToken
  const token = Token.load(tokenAddress)

  if (!token) {
    log.debug('Token not found for vault: {}', [vaultAddress!])
    return
  }

  const tokenDecimals = token.decimals

  const profitAmount = decimals.fromBigInt(
    event.params.profitAmount,
    tokenDecimals as u8
  )
  const profitAmountUSD = prices.getPrice(
    Address.fromString(tokenAddress),
    profitAmount
  )

  const feeAmount = decimals.fromBigInt(
    event.params.feeAmount,
    tokenDecimals as u8
  )
  const feeAmountUSD = prices.getPrice(
    Address.fromString(tokenAddress),
    feeAmount
  )

  vaults.updateRevenue(vaultAddress!, profitAmountUSD, feeAmountUSD)

  protocols.updateRevenue(vault.protocol, profitAmountUSD, feeAmountUSD)

  metrics.updateVaultSnapshotsAfterRevenue(
    vaultAddress!,
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )

  metrics.updateFinancialsAfterRevenue(
    profitAmountUSD,
    feeAmountUSD,
    event.block
  )
}

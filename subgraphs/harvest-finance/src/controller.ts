import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog,
} from '../generated/Controller/ControllerContract'
import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { vaults } from './utils/vaults'
import { Token, Vault } from '../generated/schema'
import { prices } from './utils/prices'
import { decimals } from './utils'

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vaultAddress = call.inputs._vault
  let timestamp = call.block.timestamp
  let blockNumber = call.block.number

  vaults.createVault(vaultAddress, timestamp, blockNumber)
}

export function handleSharePriceChangeLog(event: SharePriceChangeLog): void {
  const vaultAddress = event.params.vault
  const vault = Vault.load(vaultAddress.toHexString())

  if (!vault) return

  const inputToken = Token.load(vault.inputToken)

  if (!inputToken) return

  const priceUsd = prices.getPricePerToken(Address.fromString(vault.inputToken))

  inputToken.lastPriceUSD = priceUsd
  inputToken.lastPriceBlockNumber = event.block.number

  inputToken.save()

  vault.pricePerShare = decimals.fromBigInt(
    event.params.newSharePrice,
    inputToken.decimals as u8
  )

  const oldInputTokenBalance = vault.inputTokenBalance

  const newInputTokenBalance = vaults.extractInputTokenBalance(vaultAddress)

  if (!newInputTokenBalance) return

  vault.totalValueLockedUSD = decimals
    .fromBigInt(newInputTokenBalance, inputToken.decimals as u8)
    .times(priceUsd)

  vault.inputTokenBalance = newInputTokenBalance

  //TODO: Review this logic
  const profit = newInputTokenBalance.minus(oldInputTokenBalance)

  //If theres more input token than before, and the same amount of output token
  //Output token price should be updated

  //TVL, revenue, metrics, etc should be updated

  vault.save()
}

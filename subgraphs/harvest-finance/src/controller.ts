import {
  AddVaultAndStrategyCall,
  SharePriceChangeLog,
} from '../generated/Controller/ControllerContract'
import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { tokens } from './utils/tokens'
import { vaults } from './utils/vaults'
import { Vault as VaultTemplate } from '../generated/templates'
import { Token, Vault } from '../generated/schema'
import { prices } from './utils/prices'
import { protocols } from './utils/protocols'
import { constants } from './utils/constants'
import { fees } from './utils/fees'
import { decimals } from './utils'

export function handleAddVaultAndStrategy(call: AddVaultAndStrategyCall): void {
  let vaultAddress = call.inputs._vault

  let vault = Vault.load(vaultAddress.toHexString())

  if (vault) return

  const vaultData = vaults.getData(vaultAddress)

  if (vaultData == null) {
    log.debug('VaultCall Reverted block: {}, tx: {}', [
      call.block.number.toString(),
      call.transaction.hash.toHexString(),
    ])
    return
  }

  const underlying = vaultData.underlying

  const erc20Values = tokens.getData(underlying)

  if (erc20Values == null) {
    log.debug('Erc20Call Reverted block: {}, tx: {}', [
      call.block.number.toString(),
      call.transaction.hash.toHexString(),
    ])
    return
  }

  let inputToken = tokens.findOrInitialize(underlying)

  inputToken.name = erc20Values.name
  inputToken.symbol = erc20Values.symbol
  inputToken.decimals = erc20Values.decimals
  inputToken.lastPriceUSD = prices.getPricePerToken(underlying)
  inputToken.lastPriceBlockNumber = call.block.number

  inputToken.save()

  let outputToken = tokens.findOrInitialize(vaultAddress)

  outputToken.name = vaultData.name
  outputToken.symbol = vaultData.symbol
  outputToken.decimals = vaultData.decimals

  outputToken.save()

  vault = vaults.initialize(vaultAddress.toHexString())

  vault.name = vaultData.name
  vault.symbol = vaultData.symbol
  vault.inputToken = underlying.toHexString()
  vault.outputToken = vaultAddress.toHexString()
  vault.createdTimestamp = call.block.timestamp
  vault.createdBlockNumber = call.block.number

  //TODO: Parameterize this for multiple networks
  //ETH Mainnet performance fee is 30%
  const vaultFee = fees.getOrCreateVaultFee(
    vaultAddress.toHexString(),
    constants.FEE_TYPE_PERFORMANCE,
    BigInt.fromI32(30)
  )

  vault.fees = [vaultFee.id]

  const protocol = protocols.findOrInitialize(constants.CONTROLLER_ADDRESS)

  protocol.totalPoolCount = protocol.totalPoolCount + 1

  protocol.save()

  vault.protocol = protocol.id

  vault.save()

  VaultTemplate.create(vaultAddress)
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

import { AddVaultAndStrategyCall } from '../generated/Controller/ControllerContract'
import { VaultFee } from '../generated/schema'
import { BigDecimal, log } from '@graphprotocol/graph-ts'
import { tokens } from './utils/tokens'
import { vaults } from './utils/vaults'
import { Vault as VaultTemplate } from '../generated/templates'
import { Vault } from '../generated/schema'
import { getPricePerToken } from './utils/prices'
import { protocols } from './utils/protocols'
import { constants } from './utils/constants'

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
  inputToken.lastPriceUSD = getPricePerToken(underlying)
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

  // TODO: Remove this placeholder after logic implementation
  const fee = new VaultFee('DEPOSIT_FEE-'.concat(vaultAddress.toHexString()))
  fee.feePercentage = BigDecimal.fromString('1.5')
  fee.feeType = 'DEPOSIT_FEE'
  fee.save()
  vault.fees = [fee.id]

  const protocol = protocols.findOrInitialize(constants.CONTROLLER_ADDRESS)

  protocol.save()

  vault.protocol = protocol.id

  vault.save()

  VaultTemplate.create(vaultAddress)
}

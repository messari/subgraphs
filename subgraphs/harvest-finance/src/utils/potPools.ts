import { PotPool } from '../../generated/templates/PotPool/PotPool'
import { Vault } from '../../generated/schema'
import { log, Address } from '@graphprotocol/graph-ts'

export function getVaultFromPotPool(poolAddress: Address): Vault | null {
  const potPoolContract = PotPool.bind(poolAddress)

  const vaultAddress = potPoolContract.try_lpToken()
  if (vaultAddress.reverted) {
    log.debug(
      'Contract call to PotPool at address {} failed to obtain vault address',
      [poolAddress.toHexString()]
    )
    return null
  }

  const vault = Vault.load(vaultAddress.value.toHexString())

  if (!vault) {
    log.debug('Vault with address {} does not exist', [
      vaultAddress.value.toHexString(),
    ])
    return null
  }

  return vault
}

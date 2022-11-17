import { NoMintRewardPool } from '../../generated/templates/NoMintRewardPool/NoMintRewardPool'
import { Vault } from '../../generated/schema'
import { log, Address } from '@graphprotocol/graph-ts'

export function getVaultFromNoMintRewardPool(
  poolAddress: Address
): Vault | null {
  const poolContract = NoMintRewardPool.bind(poolAddress)

  const vaultAddress = poolContract.try_sourceVault()
  if (vaultAddress.reverted) {
    log.debug(
      'Contract call to NoMintRewardPool at address {} failed to obtain vault address',
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

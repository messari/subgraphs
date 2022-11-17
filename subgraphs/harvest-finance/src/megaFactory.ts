import { DeploymentCompleted } from '../generated/MegaFactory/MegaFactory'
import { MegaFactory } from '../generated/MegaFactory/MegaFactory'
import { PotPool } from '../generated/MegaFactory/PotPool'
import { rewardTokens } from './utils/rewardTokens'
import { constants } from './utils/constants'
import { log } from '@graphprotocol/graph-ts'
import { vaults } from './utils/vaults'
import { Vault } from '../generated/schema'
import { PotPool as PotPoolTemplate } from '../generated/templates'

export function handleDeploymentCompleted(event: DeploymentCompleted): void {
  // First we need to get the completedDeployment struct from the id obtained from the event
  let completedDeploymentId = event.params.id

  const megaFactoryContract = MegaFactory.bind(
    constants.MEGAFACTORY_CONTRACT_ADDRESS
  )

  const completedDeployment = megaFactoryContract.try_completedDeployments(
    completedDeploymentId
  )

  if (completedDeployment.reverted) {
    log.debug(
      'Contract call to MegaFactory failed to obtain completed deployment with id {}',
      [completedDeploymentId]
    )
    return
  }

  // Now we can get the data we need from the completed deployment struct

  // Vault
  let vaultAddress = completedDeployment.value.getNewVault()
  let timestamp = event.block.timestamp
  let blockNumber = event.block.number

  vaults.createVault(vaultAddress, timestamp, blockNumber)

  // PotPoolContract
  let poolAddress = completedDeployment.value.getNewPool()

  if (!poolAddress) {
    log.debug('Pool address from vault {} is null', [
      vaultAddress.toHexString(),
    ])
    return
  }

  PotPoolTemplate.create(poolAddress)
  const potPoolContract = PotPool.bind(poolAddress)

  // Obtain rewardTokenAddress
  const rewardTokenAddress = potPoolContract.try_rewardToken()
  if (rewardTokenAddress.reverted) {
    log.debug(
      'Contract call to PotPool with address {} failed to obtain rewardToken',
      [poolAddress.toHexString()]
    )
  }

  // Create rewardToken entity
  const rewardToken = rewardTokens.getOrCreateRewardToken(
    rewardTokenAddress.value
  )
  // Add rewardToken to vault
  let vault = Vault.load(vaultAddress.toHexString())

  if (!vault) {
    log.debug('No vault found with address {}', [vaultAddress.toHexString()])
    return
  }

  if (!vault!.rewardTokens!.includes(rewardToken.id)) {
    let newRewardTokens = vault.rewardTokens
    newRewardTokens!.push(rewardToken.id)
    vault.rewardTokens = newRewardTokens
  }
  vault.save()
}

import { Address } from '@graphprotocol/graph-ts'
import { assert, describe, test, afterEach, clearStore } from 'matchstick-as'
import { helpers } from './helpers'
import { RewardToken } from '../generated/schema'
import { handleDeploymentCompleted } from '../src/megaFactory'
import { createVault } from './vault.test'

describe('MegaFactory', () => {
  afterEach(() => {
    clearStore()
  })

  describe('handleDeploymentCompleted', () => {
    test('Create vault, tokens and rewardTokens', () => {
      //Create vault
      const vault = createVault()

      //Create token
      const tokenAddress = Address.fromString(
        '0x0000000000000000000000000000000000000004'
      )
      helpers.mocking.erc20.erc20(tokenAddress, 'FARM', 'FARM', 18)

      //Create pool
      const poolAddress = Address.fromString(
        '0x0000000000000000000000000000000000000005'
      )
      helpers.mocking.potPool.potPool(poolAddress, tokenAddress)

      //Create megaFactory
      const megaFactoryAddress = Address.fromString(
        '0xe1ec9151eb8d9a3451b8f623ce8b62632a6d4f4d'
      )
      helpers.mocking.megaFactory.megaFactory(
        megaFactoryAddress,
        tokenAddress,
        poolAddress,
        Address.fromString(vault.id),
        '0'
      )

      //Create event
      const event = helpers.createDeploymentCompletedEvent('0')

      //Handler
      handleDeploymentCompleted(event)

      //Assert reward token created
      assert.assertNotNull(RewardToken.load(tokenAddress.toHexString()))

      //Assert vault has reward token
      assert.fieldEquals(
        'Vault',
        vault.id,
        'rewardTokens',
        helpers.toStringArray([tokenAddress.toHexString()])
      )
    })
  })
})

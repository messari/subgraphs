import { Address } from '@graphprotocol/graph-ts'
import { assert, describe, test, afterEach, clearStore } from 'matchstick-as'
import { helpers } from './helpers'
import { RewardToken, _Strategy } from '../generated/schema'
import { handleDeploymentCompleted } from '../src/megaFactory'
import { createVaultAndProtocol } from './helpers/mocking/vault'

const vaultAddress = Address.fromString(
  '0x0000000000000000000000000000000000000001'
)
const inputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000002'
)
const outputTokenAddress = Address.fromString(
  '0x0000000000000000000000000000000000000003'
)
const protocolAddress = Address.fromString(
  '0x222412af183bceadefd72e4cb1b71f1889953b1c'
)

describe('MegaFactory', () => {
  afterEach(() => {
    clearStore()
  })

  describe('handleDeploymentCompleted', () => {
    test('Create vault, tokens and rewardTokens', () => {
      //Create vault
      const vault = createVaultAndProtocol(
        vaultAddress,
        inputTokenAddress,
        outputTokenAddress,
        protocolAddress
      )

      //Create token
      const tokenAddress = Address.fromString(
        '0x0000000000000000000000000000000000000004'
      )
      helpers.mocking.erc20.erc20(tokenAddress, 'FARM', 'FARM', 18)

      //Create pool
      const poolAddress = Address.fromString(
        '0x0000000000000000000000000000000000000005'
      )

      //Create strategy
      const strategyAddress = Address.fromString(
        '0x0000000000000000000000000000000000000006'
      )

      helpers.mocking.potPool.potPool(poolAddress, tokenAddress, Address.zero())

      //Create megaFactory
      const megaFactoryAddress = Address.fromString(
        '0xe1ec9151eb8d9a3451b8f623ce8b62632a6d4f4d'
      )
      helpers.mocking.megaFactory.megaFactory(
        megaFactoryAddress,
        tokenAddress,
        poolAddress,
        Address.fromString(vault.id),
        strategyAddress,
        '0'
      )

      //Create event
      const event =
        helpers.mocking.megaFactory.createDeploymentCompletedEvent('0')

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

      //Assert strategy entity created
      assert.assertNotNull(_Strategy.load(strategyAddress.toHexString()))

      //Assert strategy has vault
      assert.fieldEquals(
        '_Strategy',
        strategyAddress.toHexString(),
        'vault',
        vault.id
      )
    })
  })
})

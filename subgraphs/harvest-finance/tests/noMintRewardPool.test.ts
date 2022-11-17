import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test, afterEach, clearStore } from 'matchstick-as'
import { helpers } from './helpers'
import { handleStaked, handleWithdrawn } from '../src/noMintRewardPool'
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

describe('NoMintRewardPool', () => {
  afterEach(() => {
    clearStore()
  })

  describe('handleStaked', () => {
    test('Increment stakedOutputTokenAmount', () => {
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

      //Create pool
      const poolAddress = Address.fromString(
        '0x0000000000000000000000000000000000000005'
      )
      helpers.mocking.noMintRewardPool.noMintRewardPool(
        poolAddress,
        tokenAddress,
        Address.fromString(vault.id)
      )

      //Create event
      const amount = BigInt.fromI32(100)
      const event = helpers.mocking.noMintRewardPool.createStakedEvent(
        poolAddress,
        Address.zero(),
        amount
      )

      //Handler
      handleStaked(event)

      //Assert vault has stakedOutputTokenAmount
      assert.fieldEquals(
        'Vault',
        vault.id,
        'stakedOutputTokenAmount',
        amount.toString()
      )
    })
  })

  describe('handleWithdrawn', () => {
    test('Decrement stakedOutputTokenAmount', () => {
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

      //Create pool
      const poolAddress = Address.fromString(
        '0x0000000000000000000000000000000000000005'
      )
      helpers.mocking.noMintRewardPool.noMintRewardPool(
        poolAddress,
        tokenAddress,
        Address.fromString(vault.id)
      )

      // Put some stakedOutputTokenAmount in the vault
      vault.stakedOutputTokenAmount = BigInt.fromI32(200)
      vault.save()

      //Create event
      const amount = BigInt.fromI32(100)
      const event = helpers.mocking.noMintRewardPool.createWithdrawnEvent(
        poolAddress,
        Address.zero(),
        amount
      )

      //Handler
      handleWithdrawn(event)

      //Assert vault has stakedOutputTokenAmount
      assert.fieldEquals(
        'Vault',
        vault.id,
        'stakedOutputTokenAmount',
        vault.stakedOutputTokenAmount!.minus(amount).toString()
      )
    })
  })
})

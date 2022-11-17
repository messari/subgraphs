import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test, afterEach, clearStore } from 'matchstick-as'
import { handleNotifyPools } from '../src/notifyHelper'
import { helpers } from './helpers'
import { RewardToken } from '../generated/schema'
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

describe('RewardTokens', () => {
  afterEach(() => {
    clearStore()
  })

  test('creates Reward Token from pools', () => {
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
    helpers.mocking.noMintRewardPool.noMintRewardPool(
      poolAddress,
      tokenAddress,
      Address.fromString(vault.id)
    )

    //Contract call
    const call = helpers.mocking.notifyHelper.mockNotifyPoolsCall(
      [BigInt.fromI32(0)],
      [poolAddress]
    )

    //Handler
    handleNotifyPools(call)

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

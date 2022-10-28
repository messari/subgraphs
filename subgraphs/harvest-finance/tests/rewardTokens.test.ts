import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test, afterEach, clearStore } from 'matchstick-as'
import { handleNotifyPools } from '../src/notifyHelper'
import { createVault } from './vault.test'
import { mockERC20 } from './controller-utils'
import { helpers } from './utils/helpers'
import { RewardToken } from '../generated/schema'

describe('RewardTokens', () => {
  afterEach(() => {
    clearStore()
  })

  test('creates Reward Token from pools', () => {
    //Create vault
    const vault = createVault()

    //Create token
    const tokenAddress = Address.fromString(
      '0x0000000000000000000000000000000000000004'
    )
    mockERC20(tokenAddress, 'FARM', 'FARM', 18)

    //Create pool
    const poolAddress = Address.fromString(
      '0x0000000000000000000000000000000000000005'
    )
    helpers.mockNoMintRewardPool(
      poolAddress,
      tokenAddress,
      Address.fromString(vault.id)
    )

    //Contract call
    const call = helpers.mockNotifyPoolsCall([BigInt.fromI32(0)], [poolAddress])

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

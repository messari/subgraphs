import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { constants } from '../../../src/utils/constants'
import { yearnLens } from '../../../src/utils/prices/yearnLens'
import { helpers } from '../../helpers'

const tokenAddress = Address.fromString(
  '0x6b175474e89094c44da98b954eedeac495271d0f'
)

describe('prices', () => {
  describe('yearnLens', () => {
    describe('getPrice', () => {
      test('returns token price', () => {
        helpers.mocking.yearnLens.getPriceUsdcRecommended(
          constants.YEARN_LENS_CONTRACT_ADDRESS,
          tokenAddress,
          BigInt.fromString('991234')
        )

        const result = yearnLens.getPrice(tokenAddress)

        assert.stringEquals('0.991234', result!.toString())
      })
    })
  })
})

import { Address, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { constants } from '../../../src/utils/constants'
import { chainlink } from '../../../src/utils/prices/chainlink'
import { helpers } from '../../helpers'

const tokenAddress = Address.fromString(
  '0x6b175474e89094c44da98b954eedeac495271d0f'
)

describe('prices', () => {
  describe('chainlink', () => {
    describe('getPrice', () => {
      test('returns token price', () => {
        helpers.mocking.chainLink.chainLink(
          constants.CHAIN_LINK_CONTRACT_ADDRESS,
          tokenAddress,
          constants.CHAIN_LINK_USD_ADDRESS,
          BigInt.fromString('99975399'),
          8
        )

        const result = chainlink.getPrice(tokenAddress)

        assert.stringEquals('0.99975399', result!.toString())
      })
    })
  })
})

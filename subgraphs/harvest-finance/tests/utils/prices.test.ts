import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { prices } from '../../src/utils/prices'
import { mockChainLink } from '../controller-utils'
import { constants } from '../../src/utils/constants'

const tokenAddress = Address.fromString(
  '0x6b175474e89094c44da98b954eedeac495271d0f'
)

describe('prices', () => {
  describe('getPrice', () => {
    test('returns amount in USD', () => {
      mockChainLink(
        constants.CHAIN_LINK_CONTRACT_ADDRESS,
        tokenAddress,
        constants.CHAIN_LINK_USD_ADDRESS,
        BigInt.fromString('99975399'),
        8
      )

      const result = prices.getPrice(tokenAddress, BigDecimal.fromString('2'))

      assert.stringEquals('1.99950798', result.toString())
    })
  })
})

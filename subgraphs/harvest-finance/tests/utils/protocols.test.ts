import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { protocols } from '../../src/utils/protocols'
import { vaults } from '../../src/utils/vaults'

describe('protocols', () => {
  describe('calculateTotalValueLockedUSD', () => {
    test('returns total value locked usd in vaults', () => {
      const protocolId = '0x0000000000000000000000000000000000000001'

      const vaultAddress1 = Address.fromString(
        '0x0000000000000000000000000000000000000002'
      )
      const vaultAddress2 = Address.fromString(
        '0x0000000000000000000000000000000000000003'
      )

      const protocol = protocols.initialize(protocolId)

      const vault1 = vaults.initialize(vaultAddress1.toHexString())
      vault1.protocol = protocolId
      vault1.totalValueLockedUSD = BigDecimal.fromString('1000.45')
      vault1.save()

      const vault2 = vaults.initialize(vaultAddress2.toHexString())
      vault2.protocol = protocolId
      vault2.totalValueLockedUSD = BigDecimal.fromString('999.55')
      vault2.save()

      protocol._vaults = [vault1.id, vault2.id]

      protocol.save()

      const expectedProtocolTotalValueLockedUSD =
        vault1.totalValueLockedUSD.plus(vault2.totalValueLockedUSD)

      const protocolTotalValueLockedUSD =
        protocols.calculateTotalValueLockedUSD(protocolId)

      assert.stringEquals(
        protocolTotalValueLockedUSD!.toString(),
        expectedProtocolTotalValueLockedUSD.toString()
      )
    })
  })
})

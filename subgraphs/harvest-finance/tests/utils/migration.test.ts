import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { assert, describe, test } from 'matchstick-as'
import { vaults } from '../../src/utils/vaults'

const testAddress = Address.fromString(
  '0x6b175474e89094c44da98b954eedeac495271d0f'
)

const upperCaseAddress = Address.fromString(
  '0xf328f799A9C719F446E05385EB64c8a29D3B0674'
)

const lowerCaseAddress = Address.fromString(
  '0xf328f799a9c719f446e05385eb64c8a29d3b0674'
)

describe('checkIfMigrated', () => {
  test('returns false because that address is not a migrationStrategy', () => {
    const result = vaults.checkIfMigrated(testAddress)

    assert.stringEquals('false', result.toString())
  })

  test('returns true because that address is a migrationStrategy', () => {
    const result = vaults.checkIfMigrated(lowerCaseAddress)

    assert.stringEquals('true', result.toString())
  })

  test('returns true because that address is a migrationStrategy, works with upperCase addresses', () => {
    const result = vaults.checkIfMigrated(upperCaseAddress)

    assert.stringEquals('true', result.toString())
  })
})

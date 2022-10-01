import { Address, BigInt } from '@graphprotocol/graph-ts'
import { clearStore, test, assert } from 'matchstick-as/assembly/index'
import { initOrUpdateTranchedPool } from '../src/entities/tranched_pool'
import { handleTokenMinted, handleTransfer } from '../src/mappings/pool_tokens'
import { createTokenMintedEvent, createTokenTransferEvent } from './factories'
import { mockPoolBackersContractCalls, mockTranchedPoolCalls, mockTranchedPoolTokenContractCalls } from './mocks'
import { BEFORE_V2_2_TIMESTAMP } from './utils'

test('handleTokenMinted creates a new Tranched pool token record', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'
  const ownerAddress = '0x1111111111111111111111111111111111111111'
  const tokenId = BigInt.fromI32(1)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)

  const poolCreatedEvent = createTokenMintedEvent(tranchedPoolAddress, ownerAddress, tokenId)
  mockTranchedPoolTokenContractCalls(tokenId, Address.fromString(tranchedPoolAddress), Address.fromString(ownerAddress))

  handleTokenMinted(poolCreatedEvent)

  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'id', tokenId.toString())
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'user', ownerAddress)
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'interestRedeemable', '100000')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalRedeemable', '100000')

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'tokens', '[1]')

  const backerAddress = `${tranchedPoolAddress}-${ownerAddress}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', ownerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000100000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', '100000')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', '100000')
  clearStore()
})

test('handleTransfer updates token and pool backer', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'
  const user1Address = "0x1111111111111111111111111111111111111111"
  const user2Address = "0x1111111111111111111111111111111111111112"
  const tokenId = BigInt.fromI32(1)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)

  mockTranchedPoolTokenContractCalls(tokenId, Address.fromString(tranchedPoolAddress), Address.fromString(user1Address))
  const poolCreatedEvent = createTokenMintedEvent(tranchedPoolAddress, user1Address, tokenId)
  handleTokenMinted(poolCreatedEvent)

  const availableToWithdraw1 = '0'
  const availableToWithdraw2 = '500000'
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), tokenId, availableToWithdraw1)
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), tokenId, availableToWithdraw2)

  mockTranchedPoolTokenContractCalls(tokenId, Address.fromString(tranchedPoolAddress), Address.fromString(user2Address))
  const transferEvent = createTokenTransferEvent(user1Address, user2Address, tokenId)
  handleTransfer(transferEvent)

  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'id', tokenId.toString())
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'user', user2Address)
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'interestRedeemable', '100000')
  assert.fieldEquals('TranchedPoolToken', tokenId.toString(), 'principalRedeemable', '100000')

  let backerAddress = `${tranchedPoolAddress}-${user1Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user1Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', '0')

  backerAddress = `${tranchedPoolAddress}-${user2Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user2Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000100000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', '100000')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', '100000')
  clearStore()
})

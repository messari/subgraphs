import {Address} from '@graphprotocol/graph-ts'
import {clearStore, test, assert} from 'matchstick-as/assembly/index'
import {createCreditLineMigratedEvent, createTranchedPoolDepositMadeEvent} from './factories'
import {handleCreditLineMigrated, handleDepositMade} from '../src/mappings/tranched_pool'
import {mockCreditLineContractCalls, mockTranchedPoolCalls, mockTranchedPoolMultipleSlicesCalls} from './mocks'
import {AFTER_V2_2_TIMESTAMP} from './utils'
import {initOrUpdateTranchedPool} from '../src/entities/tranched_pool'
import { VERSION_V2_2 } from '../src/utils'

test('handleCreditLineMigrated updates or creates a new credit line record', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const oldCreditLineAddress = '0x1111111111111111111111111111111111111111'
  const newCreditLineAddress = '0x2222222222222222222222222222222222222222'

  const creditLineMigratedEvent = createCreditLineMigratedEvent(tranchedPoolAddress, oldCreditLineAddress, newCreditLineAddress)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(oldCreditLineAddress))
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), AFTER_V2_2_TIMESTAMP)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(newCreditLineAddress))
  handleCreditLineMigrated(creditLineMigratedEvent)

  assert.fieldEquals('CreditLine', newCreditLineAddress, 'limit', '5000000000000')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'interestApr', '130000000000000000')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'balance', '4999999996320')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'interestAccruedAsOf', '1637515148')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'paymentPeriodInDays', '30')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'termInDays', '730')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'nextDueTime', '1640107148')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'interestOwed', '0')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'termEndTime', '1697995148')
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'lastFullPaymentTime', '1637515148')

  clearStore()
})

test('handleDeposit creates user and backer if not exists', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const userAddress = '0x1111111111111111111111111111111111111111'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'

  const depositMadeEvent = createTranchedPoolDepositMadeEvent(tranchedPoolAddress, userAddress)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), AFTER_V2_2_TIMESTAMP)

  mockCreditLineContractCalls(Address.fromString(creditLineAddress), true, "5000000000000")
  handleDepositMade(depositMadeEvent)

  assert.fieldEquals('User', userAddress, 'id', userAddress)

  const backerAddress = `${tranchedPoolAddress}-${userAddress}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', userAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemed', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemed', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAtRisk', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'availableToWithdraw', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'unrealizedGains', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', '0')

  const id = depositMadeEvent.transaction.hash.toHexString()
  assert.fieldEquals('TranchedPoolDeposit', id, 'user', userAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranche', '2')
  assert.fieldEquals('TranchedPoolDeposit', id, 'tokenId', '1')
  assert.fieldEquals('TranchedPoolDeposit', id, 'blockNumber', depositMadeEvent.block.number.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'timestamp', depositMadeEvent.block.timestamp.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'amount', '5000000000000')

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[${backerAddress}]`)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_V2_2)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', '5000000000000')
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_V2_2)

  clearStore()
})

test('handleDeposit with multiple slices', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const userAddress = '0x1111111111111111111111111111111111111111'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'

  const depositMadeEvent = createTranchedPoolDepositMadeEvent(tranchedPoolAddress, userAddress)

  mockTranchedPoolMultipleSlicesCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), AFTER_V2_2_TIMESTAMP)

  mockCreditLineContractCalls(Address.fromString(creditLineAddress), true, "5000000000000")
  handleDepositMade(depositMadeEvent)

  assert.fieldEquals('User', userAddress, 'id', userAddress)

  const backerAddress = `${tranchedPoolAddress}-${userAddress}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', userAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemed', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemed', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAtRisk', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'availableToWithdraw', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'unrealizedGains', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', '0')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', '0')

  const id = depositMadeEvent.transaction.hash.toHexString()
  assert.fieldEquals('TranchedPoolDeposit', id, 'user', userAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranche', '2')
  assert.fieldEquals('TranchedPoolDeposit', id, 'tokenId', '1')
  assert.fieldEquals('TranchedPoolDeposit', id, 'blockNumber', depositMadeEvent.block.number.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'timestamp', depositMadeEvent.block.timestamp.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'amount', '5000000000000')

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[${backerAddress}]`)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_V2_2)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', '5000000000000')
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_V2_2)

  assert.fieldEquals('SeniorTrancheInfo', `${tranchedPoolAddress}-1`, 'trancheId', '1')
  assert.fieldEquals('SeniorTrancheInfo', `${tranchedPoolAddress}-3`, 'trancheId', '3')
  assert.fieldEquals('JuniorTrancheInfo', `${tranchedPoolAddress}-2`, 'trancheId', '2')
  assert.fieldEquals('JuniorTrancheInfo', `${tranchedPoolAddress}-4`, 'trancheId', '4')

  clearStore()
})

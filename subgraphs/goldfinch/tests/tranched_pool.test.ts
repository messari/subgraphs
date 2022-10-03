import {Address, BigInt} from '@graphprotocol/graph-ts'
import {clearStore, test, assert} from 'matchstick-as/assembly/index'
import {
  createCreditLineMigratedEvent,
  createTranchedPoolDepositMadeEvent,
  createTranchedPoolDrawdownMadeEvent,
  createTranchedPoolPaymentAppliedEvent,
  createTranchedPoolWithdrawalMadeEvent
} from './factories'
import {handleCreditLineMigrated, handleDepositMade, handleDrawdownMade, handlePaymentApplied, handleWithdrawalMade} from '../src/mappings/tranched_pool'
import {mockCreditLineContractCalls, mockPoolBackersContractCalls, mockTranchedPoolCalls, mockTranchedPoolTokenContractCalls} from './mocks'
import {BEFORE_V2_2_TIMESTAMP} from './utils'
import {initOrUpdateTranchedPool} from '../src/entities/tranched_pool'
import {getOrInitPoolBacker} from '../src/entities/pool_backer'
import {initOrUpdateTranchedPoolToken} from '../src/entities/pool_tokens'
import { VERSION_BEFORE_V2_2 } from '../src/utils'

test('handleCreditLineMigrated updates or creates a new credit line record', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const oldCreditLineAddress = '0x1111111111111111111111111111111111111111'
  const newCreditLineAddress = '0x2222222222222222222222222222222222222222'

  const creditLineMigratedEvent = createCreditLineMigratedEvent(
    tranchedPoolAddress,
    oldCreditLineAddress,
    newCreditLineAddress,
    false
  )

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(oldCreditLineAddress),
    "5000000000000",
    false
  )
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(newCreditLineAddress),
    "5000000000000",
    false
  )

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
  assert.fieldEquals('CreditLine', newCreditLineAddress, 'version', VERSION_BEFORE_V2_2)

  clearStore()
})

test('handleDeposit creates user and backer if not exists', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const userAddress = '0x1111111111111111111111111111111111111111'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'

  const depositMadeEvent = createTranchedPoolDepositMadeEvent(tranchedPoolAddress, userAddress, false)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)

  mockCreditLineContractCalls(Address.fromString(creditLineAddress), false, "5000000000000")
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

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[${backerAddress}]`)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', '5000000000000')
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_BEFORE_V2_2)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_BEFORE_V2_2)

  const id = depositMadeEvent.transaction.hash.toHexString()
  assert.fieldEquals('TranchedPoolDeposit', id, 'user', userAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranche', '2')
  assert.fieldEquals('TranchedPoolDeposit', id, 'tokenId', '1')
  assert.fieldEquals('TranchedPoolDeposit', id, 'blockNumber', depositMadeEvent.block.number.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'timestamp', depositMadeEvent.block.timestamp.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'amount', '5000000000000')

  clearStore()
})

test('handleDeposit with already one deposit', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const userAddress = '0x1111111111111111111111111111111111111111'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'

  const depositMadeEvent = createTranchedPoolDepositMadeEvent(tranchedPoolAddress, userAddress, false)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  let tranchedPool = initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)
  let backers = ["0x1111111111111111111111111111111111111112"]
  tranchedPool.backers = backers
  tranchedPool.save()

  let backer = getOrInitPoolBacker(Address.fromString(tranchedPoolAddress), Address.fromString(userAddress))
  backer.principalAmount = BigInt.fromString("5000000000000")
  backer.balance = BigInt.fromString("5000000000000")
  backer.save()

  mockCreditLineContractCalls(Address.fromString(creditLineAddress), false, "5000000000000")
  handleDepositMade(depositMadeEvent)

  assert.fieldEquals('User', userAddress, 'id', userAddress)

  const backerAddress = `${tranchedPoolAddress}-${userAddress}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', userAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000000000')

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[0x1111111111111111111111111111111111111112, ${backerAddress}]`)
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_BEFORE_V2_2)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_BEFORE_V2_2)

  const id = depositMadeEvent.transaction.hash.toHexString()
  assert.fieldEquals('TranchedPoolDeposit', id, 'user', userAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolDeposit', id, 'tranche', '2')
  assert.fieldEquals('TranchedPoolDeposit', id, 'tokenId', '1')
  assert.fieldEquals('TranchedPoolDeposit', id, 'blockNumber', depositMadeEvent.block.number.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'timestamp', depositMadeEvent.block.timestamp.toString())
  assert.fieldEquals('TranchedPoolDeposit', id, 'amount', '5000000000000')

  clearStore()
})


test('handlePaymentApplied updates credit line and tranched pool', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const creditLineAddress = '0x2222222222222222222222222222222222222222'

  const paymentAppliedEvent = createTranchedPoolPaymentAppliedEvent(tranchedPoolAddress, false)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  let tranchedPool = initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)
  let backers = ["0x1111111111111111111111111111111111111112"]
  tranchedPool.backers = backers
  tranchedPool.save()

  const newTranchedPoolPrincipalDeposited = "10000000000000"
  const newCreditLineBalance = "5000000000000"
  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    newTranchedPoolPrincipalDeposited
  )
  mockCreditLineContractCalls(Address.fromString(creditLineAddress), false, newCreditLineBalance)

  const juniorPoolTrancheId = `${tranchedPoolAddress}-2`
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', '5000000000000')

  handlePaymentApplied(paymentAppliedEvent)

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[0x1111111111111111111111111111111111111112]`)
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', newTranchedPoolPrincipalDeposited)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', newCreditLineBalance)
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_BEFORE_V2_2)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_BEFORE_V2_2)

  clearStore()
})

test('handleWithdrawalMade updates credit line, tranched pool, and backers', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const user1Address = "0x1111111111111111111111111111111111111111"
  const user2Address = "0x1111111111111111111111111111111111111112"
  const creditLineAddress = '0x2222222222222222222222222222222222222222'
  const token1Id = BigInt.fromI32(1)
  const token2Id = BigInt.fromI32(2)

  const withdrawalMadeEvent = createTranchedPoolWithdrawalMadeEvent(tranchedPoolAddress, false)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  let tranchedPool = initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)
  let backers = [`${tranchedPoolAddress}-${user1Address}`, `${tranchedPoolAddress}-${user2Address}`]
  tranchedPool.backers = backers
  tranchedPool.save()

  const newTranchedPoolPrincipalDeposited = "10000000000000"
  const newCreditLineBalance = "5000000000000"
  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    newTranchedPoolPrincipalDeposited
  )
  mockCreditLineContractCalls(Address.fromString(creditLineAddress), false, newCreditLineBalance)

  mockTranchedPoolTokenContractCalls(token1Id, Address.fromString(tranchedPoolAddress), Address.fromString(user1Address))
  initOrUpdateTranchedPoolToken(token1Id)
  mockTranchedPoolTokenContractCalls(token2Id, Address.fromString(tranchedPoolAddress), Address.fromString(user2Address))
  initOrUpdateTranchedPoolToken(token2Id)

  getOrInitPoolBacker(Address.fromString(tranchedPoolAddress), Address.fromString(user1Address))
  getOrInitPoolBacker(Address.fromString(tranchedPoolAddress), Address.fromString(user2Address))

  const juniorPoolTrancheId = `${tranchedPoolAddress}-2`
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'id', token1Id.toString())
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'user', user1Address)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemable', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemable', '0')

  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'id', token2Id.toString())
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'user', user2Address)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemable', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemable', '0')

  const availableToWithdraw1 = '300000'
  const availableToWithdraw2 = '500000'
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), token1Id, availableToWithdraw1)
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), token2Id, availableToWithdraw2)
  handleWithdrawalMade(withdrawalMadeEvent)

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[${tranchedPoolAddress}-${user1Address}, ${tranchedPoolAddress}-${user2Address}]`)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'tokens', '[1, 2]')
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', newTranchedPoolPrincipalDeposited)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', newCreditLineBalance)
  assert.fieldEquals('CreditLine', creditLineAddress, 'version', VERSION_BEFORE_V2_2)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'version', VERSION_BEFORE_V2_2)

  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'id', token1Id.toString())
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'user', user1Address)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemable', availableToWithdraw1)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemable', availableToWithdraw1)

  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'id', token2Id.toString())
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'user', user2Address)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemable', availableToWithdraw2)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemable', availableToWithdraw2)

  let backerAddress = `${tranchedPoolAddress}-${user1Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user1Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000300000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', availableToWithdraw1)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', availableToWithdraw1)

  backerAddress = `${tranchedPoolAddress}-${user2Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user2Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000500000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', availableToWithdraw2)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', availableToWithdraw2)

  clearStore()
})


test('handleDrawdownMade updates credit line, tranched pool, and backers', () => {
  const tranchedPoolAddress = '0x9999999999999999999999999999999999999999'
  const user1Address = "0x1111111111111111111111111111111111111111"
  const user2Address = "0x1111111111111111111111111111111111111112"
  const creditLineAddress = '0x2222222222222222222222222222222222222222'
  const token1Id = BigInt.fromI32(1)
  const token2Id = BigInt.fromI32(2)

  const drawdownMadeEvent = createTranchedPoolDrawdownMadeEvent(tranchedPoolAddress)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  let tranchedPool = initOrUpdateTranchedPool(Address.fromString(tranchedPoolAddress), BEFORE_V2_2_TIMESTAMP)
  let backers = [`${tranchedPoolAddress}-${user1Address}`, `${tranchedPoolAddress}-${user2Address}`]
  tranchedPool.backers = backers
  tranchedPool.save()

  const newTranchedPoolPrincipalDeposited = "10000000000000"
  const newCreditLineBalance = "5000000000000"
  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    newTranchedPoolPrincipalDeposited
  )
  mockCreditLineContractCalls(Address.fromString(creditLineAddress), false, newCreditLineBalance)

  mockTranchedPoolTokenContractCalls(token1Id, Address.fromString(tranchedPoolAddress), Address.fromString(user1Address))
  initOrUpdateTranchedPoolToken(token1Id)
  mockTranchedPoolTokenContractCalls(token2Id, Address.fromString(tranchedPoolAddress), Address.fromString(user2Address))
  initOrUpdateTranchedPoolToken(token2Id)

  getOrInitPoolBacker(Address.fromString(tranchedPoolAddress), Address.fromString(user1Address))
  getOrInitPoolBacker(Address.fromString(tranchedPoolAddress), Address.fromString(user2Address))

  const juniorPoolTrancheId = `${tranchedPoolAddress}-2`
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'id', token1Id.toString())
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'user', user1Address)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemable', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemable', '0')

  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'id', token2Id.toString())
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'user', user2Address)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemable', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemable', '0')

  const availableToWithdraw1 = '300000'
  const availableToWithdraw2 = '500000'
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), token1Id, availableToWithdraw1)
  mockPoolBackersContractCalls(Address.fromString(tranchedPoolAddress), token2Id, availableToWithdraw2)
  handleDrawdownMade(drawdownMadeEvent)

  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'backers', `[${tranchedPoolAddress}-${user1Address}, ${tranchedPoolAddress}-${user2Address}]`)
  assert.fieldEquals('TranchedPool', tranchedPoolAddress, 'tokens', '[1, 2]')
  assert.fieldEquals('JuniorTrancheInfo', juniorPoolTrancheId, 'principalDeposited', newTranchedPoolPrincipalDeposited)
  assert.fieldEquals('CreditLine', creditLineAddress, 'balance', newCreditLineBalance)

  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'id', token1Id.toString())
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'user', user1Address)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'interestRedeemable', availableToWithdraw1)
  assert.fieldEquals('TranchedPoolToken', token1Id.toString(), 'principalRedeemable', availableToWithdraw1)

  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'id', token2Id.toString())
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'user', user2Address)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranchedPool', tranchedPoolAddress)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'tranche', '2')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalAmount', '5000000000000')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemed', '0')
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'interestRedeemable', availableToWithdraw2)
  assert.fieldEquals('TranchedPoolToken', token2Id.toString(), 'principalRedeemable', availableToWithdraw2)

  let backerAddress = `${tranchedPoolAddress}-${user1Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user1Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000300000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', availableToWithdraw1)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', availableToWithdraw1)

  backerAddress = `${tranchedPoolAddress}-${user2Address}`
  assert.fieldEquals('PoolBacker', backerAddress, 'id', backerAddress)
  assert.fieldEquals('PoolBacker', backerAddress, 'user', user2Address)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalAmount', '5000000000000')
  assert.fieldEquals('PoolBacker', backerAddress, 'balance', '5000000500000')
  assert.fieldEquals('PoolBacker', backerAddress, 'interestRedeemable', availableToWithdraw2)
  assert.fieldEquals('PoolBacker', backerAddress, 'principalRedeemable', availableToWithdraw2)

  clearStore()
})

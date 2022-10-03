import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { clearStore, test, assert } from 'matchstick-as/assembly/index'
import { CreditLine, TranchedPool } from '../generated/schema'
import { getOrInitSeniorPoolStatus, recalculateSeniorPoolAPY, SENIOR_POOL_STATUS_ID } from '../src/entities/senior_pool'
import { handleDepositMade } from '../src/mappings/senior_pool'
import { createDepositMadeForSeniorPool, createPoolCreatedEvent } from './factories'
import { mockUpdatePoolStatusCalls, mockUpdateUserCalls } from './mocks'

test("recalculateSeniorPoolAPY updates estimatedTotalInterest", () => {
  let seniorPoolStatus = getOrInitSeniorPoolStatus()
  seniorPoolStatus.tranchedPools = ["0x9999999999999999999999999999999999999999", "0x8888888888888888888888888888888888888888"]
  seniorPoolStatus.save()

  let creditLine1 = new CreditLine("0x1")
  creditLine1.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine1.balance = BigInt.fromString("9999987633696")
  creditLine1.save()

  let tranchedPool1 = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool1.juniorFeePercent = BigInt.fromString("20")
  tranchedPool1.creditLine = creditLine1.id
  tranchedPool1.isV1StyleDeal = false
  tranchedPool1.isPaused = false
  tranchedPool1.save()

  let creditLine2 = new CreditLine("0x2")
  creditLine2.interestAprDecimal = BigDecimal.fromString("0.11")
  creditLine2.balance = BigInt.fromString("20000000000000")
  creditLine2.save()

  let tranchedPool2 = new TranchedPool("0x8888888888888888888888888888888888888888")
  tranchedPool2.juniorFeePercent = BigInt.fromString("20")
  tranchedPool2.creditLine = creditLine2.id
  tranchedPool2.isV1StyleDeal = false
  tranchedPool2.isPaused = false
  tranchedPool2.save()

  recalculateSeniorPoolAPY(seniorPoolStatus)

  assert.equals(
    ethereum.Value.fromString("2414998917948.4"), // 874998917948.4 (from 0x9) + 1540000000000 (from 0x8)
    ethereum.Value.fromString(seniorPoolStatus.estimatedTotalInterest.toString())
  )
  assert.equals(
    ethereum.Value.fromString("0"),
    ethereum.Value.fromString(seniorPoolStatus.estimatedApy.toString())
  )

  clearStore()
})

test("recalculateSeniorPoolAPY doesn't updates estimatedApy if totalPoolAssets is zero", () => {
  let seniorPoolStatus = getOrInitSeniorPoolStatus()
  seniorPoolStatus.tranchedPools = ["0x9999999999999999999999999999999999999999", "0x8888888888888888888888888888888888888888"]
  seniorPoolStatus.save()

  let creditLine1 = new CreditLine("0x1")
  creditLine1.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine1.balance = BigInt.fromString("9999987633696")
  creditLine1.save()

  let tranchedPool1 = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool1.juniorFeePercent = BigInt.fromString("20")
  tranchedPool1.creditLine = creditLine1.id
  tranchedPool1.isV1StyleDeal = false
  tranchedPool1.isPaused = false
  tranchedPool1.save()

  let creditLine2 = new CreditLine("0x2")
  creditLine2.interestAprDecimal = BigDecimal.fromString("0.11")
  creditLine2.balance = BigInt.fromString("20000000000000")
  creditLine2.save()

  let tranchedPool2 = new TranchedPool("0x8888888888888888888888888888888888888888")
  tranchedPool2.juniorFeePercent = BigInt.fromString("20")
  tranchedPool2.creditLine = creditLine2.id
  tranchedPool2.isV1StyleDeal = false
  tranchedPool2.isPaused = false
  tranchedPool2.save()

  recalculateSeniorPoolAPY(seniorPoolStatus)

  assert.equals(
    ethereum.Value.fromString("0"), // 874998917948.4 (from 0x9) + 1540000000000 (from 0x8)
    ethereum.Value.fromString(seniorPoolStatus.estimatedApy.toString())
  )
  assert.equals(
    ethereum.Value.fromString("0"),
    ethereum.Value.fromString(seniorPoolStatus.estimatedApy.toString())
  )

  clearStore()
})

test("recalculateSeniorPoolAPY updates estimatedApy", () => {
  let seniorPoolStatus = getOrInitSeniorPoolStatus()
  seniorPoolStatus.tranchedPools = ["0x9999999999999999999999999999999999999999", "0x8888888888888888888888888888888888888888"]
  seniorPoolStatus.totalPoolAssets = BigInt.fromString("98706336302853217883235969149220777057468050")
  seniorPoolStatus.save()

  let creditLine1 = new CreditLine("0x1")
  creditLine1.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine1.balance = BigInt.fromString("9999987633696")
  creditLine1.save()

  let tranchedPool1 = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool1.juniorFeePercent = BigInt.fromString("20")
  tranchedPool1.creditLine = creditLine1.id
  tranchedPool1.isV1StyleDeal = false
  tranchedPool1.isPaused = false
  tranchedPool1.save()

  let creditLine2 = new CreditLine("0x2")
  creditLine2.interestAprDecimal = BigDecimal.fromString("0.11")
  creditLine2.balance = BigInt.fromString("20000000000000")
  creditLine2.save()

  let tranchedPool2 = new TranchedPool("0x8888888888888888888888888888888888888888")
  tranchedPool2.juniorFeePercent = BigInt.fromString("20")
  tranchedPool2.creditLine = creditLine2.id
  tranchedPool2.isV1StyleDeal = false
  tranchedPool2.isPaused = false
  tranchedPool2.save()

  recalculateSeniorPoolAPY(seniorPoolStatus)

  assert.equals(
    ethereum.Value.fromString("0.02446650345261160032346124064276238"),
    ethereum.Value.fromString(seniorPoolStatus.estimatedApy.toString())
  )

  clearStore()
})

test("handleDepositMade calls recalculateSeniorPoolAPY", () => {
  const seniorPoolAddress = "0x1111111111111111111111111111111111111111"
  const capitalProviderAddress = "0x1111111111111111111111111111111111111112"

  let seniorPoolStatus = getOrInitSeniorPoolStatus()
  seniorPoolStatus.tranchedPools = ["0x9999999999999999999999999999999999999999"]
  seniorPoolStatus.save()

  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "id", SENIOR_POOL_STATUS_ID)
  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "estimatedApy", "0")
  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "estimatedTotalInterest", "0")

  let creditLine1 = new CreditLine("0x1")
  creditLine1.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine1.balance = BigInt.fromString("9999987633696")
  creditLine1.save()

  let tranchedPool1 = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool1.juniorFeePercent = BigInt.fromString("20")
  tranchedPool1.creditLine = creditLine1.id
  tranchedPool1.isV1StyleDeal = false
  tranchedPool1.isPaused = false
  tranchedPool1.save()

  const depositMadeEvent = createDepositMadeForSeniorPool(seniorPoolAddress, capitalProviderAddress)

  mockUpdatePoolStatusCalls(seniorPoolAddress)
  mockUpdateUserCalls(Address.fromString(seniorPoolAddress), Address.fromString(capitalProviderAddress))
  handleDepositMade(depositMadeEvent)

  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "id", SENIOR_POOL_STATUS_ID)
  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "estimatedApy", "34999956717936000")
  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "estimatedTotalInterest", "874998917948.4")

  clearStore()
})

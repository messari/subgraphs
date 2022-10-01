import {Address} from "@graphprotocol/graph-ts"
import {clearStore, test, assert} from "matchstick-as/assembly/index"
import {createPoolCreatedEvent} from "./factories"
import {handlePoolCreated} from "../src/mappings/goldfinch_factory"
import {mockTranchedPoolCalls} from "./mocks"
import {VERSION_BEFORE_V2_2, VERSION_V2_2} from "../src/utils"
import {SENIOR_POOL_STATUS_ID} from "../src/entities/senior_pool"

test("handlePoolCreated creates a new Tranched pool record", () => {
  const tranchedPoolAddress = "0x9999999999999999999999999999999999999999"
  const creditLineAddress = "0x1999999999999999999999999999999999999991"
  const borrowerAddress = "0x1111111111111111111111111111111111111111"

  const poolCreatedEvent = createPoolCreatedEvent(tranchedPoolAddress, borrowerAddress, false)

  mockTranchedPoolCalls(
    Address.fromString(tranchedPoolAddress),
    Address.fromString(creditLineAddress),
    "5000000000000",
    false
  )
  handlePoolCreated(poolCreatedEvent)

  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "id", tranchedPoolAddress)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedJuniorApy", "0.195")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedTotalAssets", "20000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedLeverageRatio", "3")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "remainingCapacity", "0")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "remainingJuniorCapacity", "0")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "creditLine", creditLineAddress)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "isPaused", "false")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "juniorFeePercent", "20")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "reserveFeePercent", "10")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "totalDeposited", "5000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedSeniorPoolContribution", "15000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "backers", "[]")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "tokens", "[]")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "version", VERSION_BEFORE_V2_2)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "fundableAt", "1")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "createdAt", "1")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "totalDeployed", "0")

  const seniorPoolTrancheId = `${Address.fromString(tranchedPoolAddress).toHexString()}-1`
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "trancheId", "1")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "lockedUntil", "1635209769")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "principalDeposited", "0")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "principalSharePrice", "0")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "interestSharePrice", "0")

  const juniorPoolTrancheId = `${tranchedPoolAddress}-2`
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "trancheId", "2")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "lockedUntil", "1635209769")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "principalDeposited", "5000000000000")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "principalSharePrice", "736000000")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "interestSharePrice", "9611500737600000")

  assert.fieldEquals("CreditLine", creditLineAddress, "limit", "5000000000000")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestApr", "130000000000000000")
  assert.fieldEquals("CreditLine", creditLineAddress, "balance", "4999999996320")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestAccruedAsOf", "1637515148")
  assert.fieldEquals("CreditLine", creditLineAddress, "paymentPeriodInDays", "30")
  assert.fieldEquals("CreditLine", creditLineAddress, "termInDays", "730")
  assert.fieldEquals("CreditLine", creditLineAddress, "nextDueTime", "1640107148")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestOwed", "0")
  assert.fieldEquals("CreditLine", creditLineAddress, "termEndTime", "1697995148")
  assert.fieldEquals("CreditLine", creditLineAddress, "lastFullPaymentTime", "1637515148")
  assert.fieldEquals("CreditLine", creditLineAddress, "version", VERSION_BEFORE_V2_2)

  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "tranchedPools", `[${tranchedPoolAddress}]`)

  clearStore()
})

test("handlePoolCreated creates a new Tranched pool record after V2_2 migration", () => {
  const tranchedPoolAddress = "0x9999999999999999999999999999999999999999"
  const creditLineAddress = "0x1999999999999999999999999999999999999991"
  const borrowerAddress = "0x1111111111111111111111111111111111111111"

  const poolCreatedEvent = createPoolCreatedEvent(tranchedPoolAddress, borrowerAddress)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  handlePoolCreated(poolCreatedEvent)

  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "id", tranchedPoolAddress)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedJuniorApy", "0.195")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedTotalAssets", "20000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedLeverageRatio", "3")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "remainingCapacity", "0")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "creditLine", creditLineAddress)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "isPaused", "false")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "juniorFeePercent", "20")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "reserveFeePercent", "10")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "totalDeposited", "5000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "estimatedSeniorPoolContribution", "15000000000000")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "backers", "[]")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "tokens", "[]")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "version", VERSION_V2_2)
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "fundableAt", "1")
  assert.fieldEquals("TranchedPool", tranchedPoolAddress, "totalDeployed", "1")

  const seniorPoolTrancheId = `${Address.fromString(tranchedPoolAddress).toHexString()}-1`
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "trancheId", "1")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "lockedUntil", "1635209769")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "principalDeposited", "0")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "principalSharePrice", "0")
  assert.fieldEquals("SeniorTrancheInfo", seniorPoolTrancheId, "interestSharePrice", "0")

  const juniorPoolTrancheId = `${tranchedPoolAddress}-2`
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "trancheId", "2")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "lockedUntil", "1635209769")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "principalDeposited", "5000000000000")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "principalSharePrice", "736000000")
  assert.fieldEquals("JuniorTrancheInfo", juniorPoolTrancheId, "interestSharePrice", "9611500737600000")

  assert.fieldEquals("CreditLine", creditLineAddress, "limit", "5000000000000")
  assert.fieldEquals("CreditLine", creditLineAddress, "maxLimit", "10000000000000")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestApr", "130000000000000000")
  assert.fieldEquals("CreditLine", creditLineAddress, "balance", "4999999996320")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestAccruedAsOf", "1637515148")
  assert.fieldEquals("CreditLine", creditLineAddress, "paymentPeriodInDays", "30")
  assert.fieldEquals("CreditLine", creditLineAddress, "termInDays", "730")
  assert.fieldEquals("CreditLine", creditLineAddress, "nextDueTime", "1640107148")
  assert.fieldEquals("CreditLine", creditLineAddress, "interestOwed", "0")
  assert.fieldEquals("CreditLine", creditLineAddress, "termEndTime", "1697995148")
  assert.fieldEquals("CreditLine", creditLineAddress, "lastFullPaymentTime", "1637515148")
  assert.fieldEquals("CreditLine", creditLineAddress, "version", VERSION_V2_2)

  assert.fieldEquals("SeniorPoolStatus", SENIOR_POOL_STATUS_ID, "tranchedPools", `[${tranchedPoolAddress}]`)

  clearStore()
})

test("handlePoolCreated ignores invalid pools", () => {
  const tranchedPoolAddress = "0x0e2e11dc77bbe75b2b65b57328a8e4909f7da1eb"
  const creditLineAddress = "0x1999999999999999999999999999999999999991"
  const borrowerAddress = "0x1111111111111111111111111111111111111111"

  const poolCreatedEvent = createPoolCreatedEvent(tranchedPoolAddress, borrowerAddress)

  mockTranchedPoolCalls(Address.fromString(tranchedPoolAddress), Address.fromString(creditLineAddress))
  handlePoolCreated(poolCreatedEvent)

  assert.notInStore("TranchedPool", tranchedPoolAddress)

  clearStore()
})

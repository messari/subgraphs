import {BigDecimal, BigInt, ethereum} from "@graphprotocol/graph-ts"
import {clearStore, test, assert} from "matchstick-as/assembly/index"
import {CreditLine, TranchedPool} from "../generated/schema"
import {calculateEstimatedInterestForTranchedPool, estimateJuniorAPY} from "../src/entities/helpers"

test("estimates junior apy for v1 pool", () => {
  let creditLine = new CreditLine("0x1")
  creditLine.interestAprDecimal = BigDecimal.fromString("0.05")
  creditLine.save()

  let tranchedPool = new TranchedPool("0xf74ea34ac88862b7ff419e60e476be2651433e68")
  tranchedPool.creditLine = creditLine.id
  tranchedPool.isV1StyleDeal = true
  tranchedPool.isPaused = false
  tranchedPool.save()

  const apy = estimateJuniorAPY(tranchedPool)
  assert.equals(ethereum.Value.fromString("0.05"), ethereum.Value.fromString(apy.toString()))

  clearStore()
})

test(
  "estimates junior apy without credit line (throws error)",
  () => {
    let tranchedPool = new TranchedPool("0xf74ea34ac88862b7ff419e60e476be2651433e68")
    tranchedPool.isV1StyleDeal = true
    tranchedPool.isPaused = false
    tranchedPool.save()

    estimateJuniorAPY(tranchedPool)

    clearStore()
  },
  true
)

test("estimates junior apy (stratos)", () => {
  let creditLine = new CreditLine("0x1")
  creditLine.interestAprDecimal = BigDecimal.fromString("0.11")
  creditLine.limit = BigInt.fromString("20000000000000")
  creditLine.balance = BigInt.fromString("20000000000000")
  creditLine.save()

  let tranchedPool = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool.juniorFeePercent = BigInt.fromString("20")
  tranchedPool.reserveFeePercent = BigInt.fromString("10")
  tranchedPool.estimatedLeverageRatio = BigInt.fromString("4")
  tranchedPool.creditLine = creditLine.id
  tranchedPool.isV1StyleDeal = false
  tranchedPool.isPaused = false
  tranchedPool.save()

  const apy = estimateJuniorAPY(tranchedPool)
  assert.equals(ethereum.Value.fromString("0.187"), ethereum.Value.fromString(apy.toString()))

  clearStore()
})

test("estimates junior apy (cauris)", () => {
  let creditLine = new CreditLine("0x1")
  creditLine.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine.limit = BigInt.fromString("5142674000000")
  creditLine.balance = BigInt.fromString("5142673966942")
  creditLine.save()

  let tranchedPool = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool.juniorFeePercent = BigInt.fromString("20")
  tranchedPool.reserveFeePercent = BigInt.fromString("10")
  tranchedPool.estimatedLeverageRatio = BigInt.fromString("4")
  tranchedPool.creditLine = creditLine.id
  tranchedPool.isV1StyleDeal = false
  tranchedPool.isPaused = false
  tranchedPool.save()

  const apy = estimateJuniorAPY(tranchedPool)
  assert.equals(ethereum.Value.fromString("0.2125"), ethereum.Value.fromString(apy.toString()))

  clearStore()
})

test("calculateEstimatedInterestForTranchedPool without credit line", () => {
  let tranchedPool = new TranchedPool("0xf74ea34ac88862b7ff419e60e476be2651433e68")
  tranchedPool.isV1StyleDeal = true
  tranchedPool.isPaused = false
  tranchedPool.save()

  const apy = calculateEstimatedInterestForTranchedPool(tranchedPool.id)
  assert.equals(ethereum.Value.fromString("0"), ethereum.Value.fromString(apy.toString()))

  clearStore()
})

test("calculateEstimatedInterestForTranchedPool without tranched pool", () => {
  const apy = calculateEstimatedInterestForTranchedPool("0xf74ea34ac88862b7ff419e60e476be2651433e68")
  assert.equals(ethereum.Value.fromString("0"), ethereum.Value.fromString(apy.toString()))

  clearStore()
})

test("calculateEstimatedInterestForTranchedPool with low balance", () => {
  let creditLine = new CreditLine("0x1")
  creditLine.interestAprDecimal = BigDecimal.fromString("0.125")
  creditLine.balance = BigInt.fromString("9999987633696")
  creditLine.save()

  let tranchedPool = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool.juniorFeePercent = BigInt.fromString("20")
  tranchedPool.creditLine = creditLine.id
  tranchedPool.isV1StyleDeal = false
  tranchedPool.isPaused = false
  tranchedPool.save()

  const estimatedInterest = calculateEstimatedInterestForTranchedPool(tranchedPool.id)
  assert.equals(ethereum.Value.fromString("874998917948.4"), ethereum.Value.fromString(estimatedInterest.toString()))

  clearStore()
})

test("calculateEstimatedInterestForTranchedPool with high balance", () => {
  let creditLine = new CreditLine("0x1")
  creditLine.interestAprDecimal = BigDecimal.fromString("0.11")
  creditLine.balance = BigInt.fromString("20000000000000")
  creditLine.save()

  let tranchedPool = new TranchedPool("0x9999999999999999999999999999999999999999")
  tranchedPool.juniorFeePercent = BigInt.fromString("20")
  tranchedPool.creditLine = creditLine.id
  tranchedPool.isV1StyleDeal = false
  tranchedPool.isPaused = false
  tranchedPool.save()

  const estimatedInterest = calculateEstimatedInterestForTranchedPool(tranchedPool.id)
  assert.equals(ethereum.Value.fromString("1540000000000"), ethereum.Value.fromString(estimatedInterest.toString()))

  clearStore()
})

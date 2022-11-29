import {Address, BigDecimal, BigInt, ethereum} from "@graphprotocol/graph-ts"
import {JuniorTrancheInfo, SeniorTrancheInfo, TranchedPool, CreditLine, Transaction} from "../../generated/schema"
import {SeniorPool as SeniorPoolContract} from "../../generated/SeniorPool/SeniorPool"
import {FixedLeverageRatioStrategy} from "../../generated/templates/TranchedPool/FixedLeverageRatioStrategy"
import {MAINNET_METADATA} from "../metadata"
import {VERSION_BEFORE_V2_2} from "../utils"
import {getOrInitUser} from "./user"

const FIDU_DECIMAL_PLACES = 18
const FIDU_DECIMALS = BigInt.fromI32(10).pow(FIDU_DECIMAL_PLACES as u8)
const ONE = BigInt.fromString("1")
const ZERO = BigInt.fromString("0")
const ONE_HUNDRED = BigDecimal.fromString("100")

export function fiduFromAtomic(amount: BigInt): BigInt {
  return amount.div(FIDU_DECIMALS)
}

export function getTotalDeposited(
  address: Address,
  juniorTranches: JuniorTrancheInfo[],
  seniorTranches: SeniorTrancheInfo[]
): BigInt {
  let totalDeposited = new BigInt(0)

  for (let i = 0, k = juniorTranches.length; i < k; ++i) {
    let jrTranche = juniorTranches[i]
    let srTranche = seniorTranches[i]

    if (!jrTranche || !srTranche) {
      throw new Error(`Missing tranche information for ${address.toHexString()}`)
    }

    totalDeposited = totalDeposited.plus(jrTranche.principalDeposited)
    totalDeposited = totalDeposited.plus(srTranche.principalDeposited)
  }
  return totalDeposited
}

export function getJuniorDeposited(juniorTranches: JuniorTrancheInfo[]): BigInt {
  let juniorDeposited = BigInt.zero()
  for (let i = 0; i < juniorTranches.length; i++) {
    juniorDeposited = juniorDeposited.plus(juniorTranches[i].principalDeposited)
  }
  return juniorDeposited
}

const fixedLeverageRatioAddress = Address.fromString("0x9b2ACD3fd9aa6c60B26CF748bfFF682f27893320") // This is hardcoded from mainnet. When running off the local chain, this shouldn't be needed.

export function getEstimatedSeniorPoolInvestment(
  tranchedPoolAddress: Address,
  tranchedPoolVersion: string,
  seniorPoolAddress: Address
): BigInt {
  if (tranchedPoolVersion == VERSION_BEFORE_V2_2) {
    // This means that the pool is not compatible with multiple slices, so we need to use a hack to estimate senior pool investment
    const fixedLeverageRatioStrategyContract = FixedLeverageRatioStrategy.bind(fixedLeverageRatioAddress)
    return fixedLeverageRatioStrategyContract.estimateInvestment(seniorPoolAddress, tranchedPoolAddress)
  }
  const seniorPoolContract = SeniorPoolContract.bind(seniorPoolAddress)
  return seniorPoolContract.estimateInvestment(tranchedPoolAddress)
}

/**
 * This exists solely for legacy pools. It looks at a hard-coded metadata blob to determine whether a tranched pool's address is a known legacy pool
 */
export function isV1StyleDeal(address: Address): boolean {
  const poolMetadata = MAINNET_METADATA.get(address.toHexString())
  if (poolMetadata != null) {
    const isV1StyleDeal = poolMetadata.toObject().get("v1StyleDeal")
    if (isV1StyleDeal != null) {
      return isV1StyleDeal.toBool()
    }
  }
  return false
}

export function getCreatedAtOverride(address: Address): BigInt | null {
  const poolMetadata = MAINNET_METADATA.get(address.toHexString())
  if (poolMetadata != null) {
    const createdAt = poolMetadata.toObject().get("createdAt")
    if (createdAt != null) {
      return createdAt.toBigInt()
    }
  }
  return null
}

export function calculateEstimatedInterestForTranchedPool(tranchedPoolId: string): BigDecimal {
  const tranchedPool = TranchedPool.load(tranchedPoolId)
  if (!tranchedPool) {
    return BigDecimal.fromString("0")
  }
  const creditLine = CreditLine.load(tranchedPool.creditLine)
  if (!creditLine) {
    return BigDecimal.fromString("0")
  }

  const protocolFee = BigDecimal.fromString("0.1")
  const leverageRatio = tranchedPool.estimatedLeverageRatio
  const seniorFraction = leverageRatio
    ? leverageRatio.divDecimal(ONE.plus(leverageRatio).toBigDecimal())
    : ONE.toBigDecimal()
  const seniorBalance = creditLine.balance.toBigDecimal().times(seniorFraction)
  const juniorFeePercentage = tranchedPool.juniorFeePercent.toBigDecimal().div(ONE_HUNDRED)
  const isV1Pool = tranchedPool.isV1StyleDeal
  const seniorPoolPercentageOfInterest = isV1Pool
    ? BigDecimal.fromString("1").minus(protocolFee)
    : BigDecimal.fromString("1").minus(juniorFeePercentage).minus(protocolFee)
  return seniorBalance.times(creditLine.interestAprDecimal).times(seniorPoolPercentageOfInterest)
}

export function estimateJuniorAPY(tranchedPool: TranchedPool): BigDecimal {
  if (!tranchedPool) {
    return BigDecimal.fromString("0")
  }

  const creditLine = CreditLine.load(tranchedPool.creditLine)
  if (!creditLine) {
    throw new Error(`Missing creditLine for TranchedPool ${tranchedPool.id}`)
  }

  if (isV1StyleDeal(Address.fromString(tranchedPool.id))) {
    return creditLine.interestAprDecimal
  }

  let balance: BigInt
  if (!creditLine.balance.isZero()) {
    balance = creditLine.balance
  } else if (!creditLine.limit.isZero()) {
    balance = creditLine.limit
  } else if (!creditLine.maxLimit.isZero()) {
    balance = creditLine.maxLimit
  } else {
    return BigDecimal.fromString("0")
  }

  const leverageRatio = tranchedPool.estimatedLeverageRatio
  // A missing leverage ratio implies this was a v1 style deal and the senior pool supplied all the capital
  let seniorFraction = leverageRatio
    ? leverageRatio.divDecimal(ONE.plus(leverageRatio).toBigDecimal())
    : ONE.toBigDecimal()
  let juniorFraction = leverageRatio ? ONE.divDecimal(ONE.plus(leverageRatio).toBigDecimal()) : ZERO.toBigDecimal()
  let interestRateFraction = creditLine.interestAprDecimal.div(ONE_HUNDRED)
  let juniorFeeFraction = tranchedPool.juniorFeePercent.divDecimal(ONE_HUNDRED)
  let reserveFeeFraction = tranchedPool.reserveFeePercent.divDecimal(ONE_HUNDRED)

  let grossSeniorInterest = balance.toBigDecimal().times(interestRateFraction).times(seniorFraction)
  let grossJuniorInterest = balance.toBigDecimal().times(interestRateFraction).times(juniorFraction)
  const juniorFee = grossSeniorInterest.times(juniorFeeFraction)

  const juniorReserveFeeOwed = grossJuniorInterest.times(reserveFeeFraction)
  let netJuniorInterest = grossJuniorInterest.plus(juniorFee).minus(juniorReserveFeeOwed)
  let juniorTranche = balance.toBigDecimal().times(juniorFraction)
  return netJuniorInterest.div(juniorTranche).times(ONE_HUNDRED)
}

/**
 * A helper function that creates a Transaction entity from an Ethereum event. Does not save the entity, you must call .save() yourself, after you add any additional properties.
 * @param event Ethereum event to process. Can be any event.
 * @param category The category to assign to this. Must conform to the TransactionCategory enum.
 * @param userAddress The address of the user that should be associated with this transaction. The corresponding `user` entity will be created if it doesn't exist
 * @returns Instance of a Transaction entity.
 */
export function createTransactionFromEvent(event: ethereum.Event, category: string, userAddress: Address): Transaction {
  const transaction = new Transaction(event.transaction.hash.concatI32(event.logIndex.toI32()))
  transaction.transactionHash = event.transaction.hash
  transaction.timestamp = event.block.timestamp.toI32()
  transaction.blockNumber = event.block.number.toI32()
  transaction.category = category
  const user = getOrInitUser(userAddress)
  transaction.user = user.id
  transaction.amount = BigInt.zero() // just a sane default
  transaction.amountToken = "USDC" // just a sane default
  return transaction
}

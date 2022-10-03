import {Address, BigInt, ethereum} from "@graphprotocol/graph-ts"
import {newMockEvent} from "matchstick-as"
import {PoolCreated} from "../generated/GoldfinchFactory/GoldfinchFactory"
import {
  CreditLineMigrated,
  DepositMade as TranchedPoolDepositMade,
  DrawdownMade,
  PaymentApplied,
  WithdrawalMade,
} from "../generated/templates/TranchedPool/TranchedPool"
import {TokenMinted, Transfer} from "../generated/PoolTokens/PoolTokens"
import {AFTER_V2_2_TIMESTAMP, BEFORE_V2_2_TIMESTAMP} from "./utils"
import {DepositMade as SeniorPoolDepositMade} from "../generated/SeniorPool/SeniorPool"

export function createPoolCreatedEvent(poolAddress: string, borrower: string, v2_2: boolean = true): PoolCreated {
  let mockEvent = newMockEvent()
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }

  const poolCreatedEvent = new PoolCreated(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  poolCreatedEvent.parameters = new Array()

  const poolParam = new ethereum.EventParam("pool", ethereum.Value.fromAddress(Address.fromString(poolAddress)))
  const borrowerParam = new ethereum.EventParam("borrower", ethereum.Value.fromAddress(Address.fromString(borrower)))

  poolCreatedEvent.parameters.push(poolParam)
  poolCreatedEvent.parameters.push(borrowerParam)

  return poolCreatedEvent
}

export function createCreditLineMigratedEvent(
  tranchedPoolAddress: string,
  oldCreditLineAddress: string,
  newCreditLineAddress: string,
  v2_2: boolean = true
): CreditLineMigrated {
  let mockEvent = newMockEvent()
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }

  const creditLineMigratedEvent = new CreditLineMigrated(
    Address.fromString(tranchedPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  creditLineMigratedEvent.parameters = new Array()

  const oldCreditLineParam = new ethereum.EventParam(
    "oldCreditLine",
    ethereum.Value.fromAddress(Address.fromString(oldCreditLineAddress))
  )
  const newCreditLineParam = new ethereum.EventParam(
    "newCreditLine",
    ethereum.Value.fromAddress(Address.fromString(newCreditLineAddress))
  )

  creditLineMigratedEvent.parameters.push(oldCreditLineParam)
  creditLineMigratedEvent.parameters.push(newCreditLineParam)

  return creditLineMigratedEvent
}

export function createTranchedPoolDepositMadeEvent(
  tranchedPoolAddress: string,
  owner: string,
  v2_2: boolean = true
): TranchedPoolDepositMade {
  let mockEvent = newMockEvent()
  const amount = BigInt.fromString("5000000000000")
  const tranche = BigInt.fromI32(2)
  const tokenId = BigInt.fromI32(1)
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }

  const depositMadeEvent = new TranchedPoolDepositMade(
    Address.fromString(tranchedPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  depositMadeEvent.parameters = new Array()
  const ownerParam = new ethereum.EventParam("owner", ethereum.Value.fromAddress(Address.fromString(owner)))
  const amountParam = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  const trancheParam = new ethereum.EventParam("tranche", ethereum.Value.fromUnsignedBigInt(tranche))
  const tokenIdParam = new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))

  // Order matters: event DepositMade(address indexed owner, uint256 indexed tranche, uint256 indexed tokenId, uint256 amount)
  depositMadeEvent.parameters.push(ownerParam)
  depositMadeEvent.parameters.push(trancheParam)
  depositMadeEvent.parameters.push(tokenIdParam)
  depositMadeEvent.parameters.push(amountParam)

  return depositMadeEvent
}

export function createTranchedPoolPaymentAppliedEvent(
  tranchedPoolAddress: string,
  v2_2: boolean = true
): PaymentApplied {
  let mockEvent = newMockEvent()
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }
  const defaultValue = ethereum.Value.fromI32(1)
  const defaultPayer = ethereum.Value.fromAddress(Address.fromString("0x1000000000000000000000000000000000000000"))
  const defaultPool = ethereum.Value.fromAddress(Address.fromString(tranchedPoolAddress))

  const paymentAppliedEvent = new PaymentApplied(
    Address.fromString(tranchedPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  paymentAppliedEvent.parameters = new Array()
  const payerParam = new ethereum.EventParam("payer", defaultPayer)
  const poolParam = new ethereum.EventParam("pool", defaultPool)
  const interestAmountParam = new ethereum.EventParam("interestAmount", defaultValue)
  const principalAmountParam = new ethereum.EventParam("principalAmount", defaultValue)
  const remainingAmountParam = new ethereum.EventParam("remainingAmount", defaultValue)
  const reserveAmountParam = new ethereum.EventParam("reserveAmount", defaultValue)

  // Order matters:
  // event PaymentApplied(
  //   address indexed payer,
  //   address indexed pool,
  //   uint256 interestAmount,
  //   uint256 principalAmount,
  //   uint256 remainingAmount,
  //   uint256 reserveAmount
  // );
  paymentAppliedEvent.parameters.push(payerParam)
  paymentAppliedEvent.parameters.push(poolParam)
  paymentAppliedEvent.parameters.push(interestAmountParam)
  paymentAppliedEvent.parameters.push(principalAmountParam)
  paymentAppliedEvent.parameters.push(remainingAmountParam)
  paymentAppliedEvent.parameters.push(reserveAmountParam)

  return paymentAppliedEvent
}

export function createTranchedPoolWithdrawalMadeEvent(
  tranchedPoolAddress: string,
  v2_2: boolean = true
): WithdrawalMade {
  let mockEvent = newMockEvent()
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }
  const defaultValue = ethereum.Value.fromString("1")
  const defaultOwner = ethereum.Value.fromAddress(Address.fromString("0x1000000000000000000000000000000000000000"))

  const withdrawalMadeEvent = new WithdrawalMade(
    Address.fromString(tranchedPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  withdrawalMadeEvent.parameters = new Array()
  const ownerParam = new ethereum.EventParam("owner", defaultOwner)
  const trancheParam = new ethereum.EventParam("tranche", defaultValue)
  const tokenIdParam = new ethereum.EventParam("tokenId", defaultValue)
  const interestWithdrawnParam = new ethereum.EventParam("interestWithdrawn", ethereum.Value.fromI32(1))
  const principalWithdrawnParam = new ethereum.EventParam("principalWithdrawn", ethereum.Value.fromI32(1))

  // Order matters:
  // event WithdrawalMade(
  //   address indexed owner
  //   uint256 indexed tranche
  //   uint256 indexed tokenId
  //   uint256 interestWithdrawn
  //   uint256 principalWithdrawn
  // );
  withdrawalMadeEvent.parameters.push(ownerParam)
  withdrawalMadeEvent.parameters.push(trancheParam)
  withdrawalMadeEvent.parameters.push(tokenIdParam)
  withdrawalMadeEvent.parameters.push(interestWithdrawnParam)
  withdrawalMadeEvent.parameters.push(principalWithdrawnParam)

  return withdrawalMadeEvent
}

export function createTokenMintedEvent(
  tranchedPoolAddress: string,
  ownerAddress: string,
  tokenId: BigInt
): TokenMinted {
  let mockEvent = newMockEvent()

  const tokenMintedEvent = new TokenMinted(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  tokenMintedEvent.parameters = new Array()
  const ownerParam = new ethereum.EventParam("owner", ethereum.Value.fromAddress(Address.fromString(ownerAddress)))
  const poolParam = new ethereum.EventParam("pool", ethereum.Value.fromAddress(Address.fromString(tranchedPoolAddress)))
  const tokenIdParam = new ethereum.EventParam("tokenId", ethereum.Value.fromSignedBigInt(tokenId))
  const amountParam = new ethereum.EventParam("amount", ethereum.Value.fromString("1"))
  const trancheParam = new ethereum.EventParam("tranche", ethereum.Value.fromString("2"))

  // event TokenMinted(
  //   address indexed owner
  //   address indexed pool
  //   uint256 indexed tokenId
  //   uint256 amount
  //   uint256 tranche
  // );
  tokenMintedEvent.parameters.push(ownerParam)
  tokenMintedEvent.parameters.push(poolParam)
  tokenMintedEvent.parameters.push(tokenIdParam)
  tokenMintedEvent.parameters.push(amountParam)
  tokenMintedEvent.parameters.push(trancheParam)
  return tokenMintedEvent
}

export function createTranchedPoolDrawdownMadeEvent(tranchedPoolAddress: string, v2_2: boolean = true): DrawdownMade {
  let mockEvent = newMockEvent()
  if (v2_2) {
    mockEvent.block.timestamp = AFTER_V2_2_TIMESTAMP
  } else {
    mockEvent.block.timestamp = BEFORE_V2_2_TIMESTAMP
  }

  const defaultValue = ethereum.Value.fromI32(1)
  const defaultBorrower = ethereum.Value.fromAddress(Address.fromString("0x1000000000000000000000000000000000000000"))

  const drawdownMadeEvent = new DrawdownMade(
    Address.fromString(tranchedPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  drawdownMadeEvent.parameters = new Array()
  const borrowerParam = new ethereum.EventParam("borrower", defaultBorrower)
  const amountParam = new ethereum.EventParam("amount", defaultValue)
  drawdownMadeEvent.parameters.push(borrowerParam)
  drawdownMadeEvent.parameters.push(amountParam)
  return drawdownMadeEvent
}

export function createTokenTransferEvent(user1Address: string, user2Address: string, tokenId: BigInt): Transfer {
  let mockEvent = newMockEvent()

  const transferEvent = new Transfer(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  transferEvent.parameters = new Array()
  const toParam = new ethereum.EventParam("toParam", ethereum.Value.fromAddress(Address.fromString(user2Address)))
  const fromParam = new ethereum.EventParam("fromParam", ethereum.Value.fromAddress(Address.fromString(user1Address)))
  const tokenIdParam = new ethereum.EventParam("tokenId", ethereum.Value.fromSignedBigInt(tokenId))

  transferEvent.parameters.push(fromParam)
  transferEvent.parameters.push(toParam)
  transferEvent.parameters.push(tokenIdParam)
  return transferEvent
}

export function createDepositMadeForSeniorPool(
  seniorPoolAddress: string,
  capitalProviderAddress: string
): SeniorPoolDepositMade {
  const amount = BigInt.fromString("5000000000000")
  const shares = BigInt.fromString("5000000000000")

  let mockEvent = newMockEvent()
  const depositMadeEvent = new SeniorPoolDepositMade(
    Address.fromString(seniorPoolAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  )

  depositMadeEvent.parameters = new Array()

  const capitalProviderParam = new ethereum.EventParam(
    "capitalProvider",
    ethereum.Value.fromAddress(Address.fromString(capitalProviderAddress))
  )
  const amountParam = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  const sharesParam = new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))

  depositMadeEvent.parameters.push(capitalProviderParam)
  depositMadeEvent.parameters.push(amountParam)
  depositMadeEvent.parameters.push(sharesParam)
  return depositMadeEvent
}

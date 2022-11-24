import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction, newMockEvent } from 'matchstick-as'
import {
  Withdraw as WithdrawEvent,
  Deposit as DepositEvent,
  Transfer as TransferEvent,
} from '../../../generated/Controller/VaultContract'
import { protocols } from '../../../src/utils/protocols'
import { vaults } from '../../../src/utils/vaults'
import { Vault } from '../../../generated/schema'

export function createVaultAndProtocol(
  vaultAddress: Address,
  inputTokenAddress: Address,
  outputTokenAddress: Address,
  protocolAddress: Address
): Vault {
  const protocol = protocols.initialize(protocolAddress.toHexString())
  protocol.totalPoolCount = protocol.totalPoolCount + 1
  protocol._vaults = [vaultAddress.toHexString()]
  protocol.save()

  const vault = vaults.initialize(vaultAddress.toHexString())
  vault.name = 'FARM_USDC'
  vault.symbol = 'fUSDC'
  vault.inputToken = inputTokenAddress.toHexString()
  vault.outputToken = outputTokenAddress.toHexString()
  vault.protocol = protocolAddress.toHexString()

  const feeId = 'DEPOSIT-'.concat(vaultAddress.toHexString())

  vault.fees = [feeId]

  vault.save()

  return vault
}

export function underlyingBalanceWithInvestment(
  address: Address,
  value: BigInt
): void {
  createMockedFunction(
    address,
    'underlyingBalanceWithInvestment',
    'underlyingBalanceWithInvestment():(uint256)'
  ).returns([ethereum.Value.fromUnsignedBigInt(value)])
}

export function underlying(address: Address, value: Address): void {
  createMockedFunction(address, 'underlying', 'underlying():(address)').returns(
    [ethereum.Value.fromAddress(value)]
  )
}

export function createWithdrawEvent(
  amount: BigInt,
  beneficiary: Address
): WithdrawEvent {
  let mockEvent = newMockEvent()

  let event = new WithdrawEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam(
      'beneficiary',
      ethereum.Value.fromAddress(beneficiary)
    ),
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ]

  return event
}

export function createDepositEvent(
  amount: BigInt,
  beneficiary: Address
): DepositEvent {
  let mockEvent = newMockEvent()

  let event = new DepositEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam(
      'beneficiary',
      ethereum.Value.fromAddress(beneficiary)
    ),
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ]

  return event
}

export function createTransferEvent(
  from: Address,
  to: Address,
  amount: BigInt
): TransferEvent {
  let mockEvent = newMockEvent()

  let event = new TransferEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam('from', ethereum.Value.fromAddress(from)),
    new ethereum.EventParam('to', ethereum.Value.fromAddress(to)),
    new ethereum.EventParam('value', ethereum.Value.fromUnsignedBigInt(amount)),
  ]

  return event
}

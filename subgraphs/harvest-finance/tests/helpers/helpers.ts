import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { newMockCall, newMockEvent } from 'matchstick-as'
import { AddVaultAndStrategyCall } from '../../generated/Controller/ControllerContract'
import { NotifyPoolsCall } from '../../generated/NotifyHelper/NotifyHelper'
import {
  Withdraw as WithdrawEvent,
  Deposit as DepositEvent,
  Transfer as TransferEvent,
} from '../../generated/Controller/VaultContract'
import { DeploymentCompleted as DeploymentCompletedEvent } from '../../generated/MegaFactory/MegaFactory'
import * as mocking from './mocking'
import * as asserting from './asserting'

export function toStringArray(array: string[]): string {
  return '[' + array.toString() + ']'
}

export function mockNotifyPoolsCall(
  amounts: BigInt[],
  poolAddresses: Address[]
): NotifyPoolsCall {
  let to = Address.fromString('0x0000000000000000000000000000000000000009')
  let from = Address.fromString('0x0000000000000000000000000000000000000008')
  let call = newMockCall()
  call.to = to
  call.from = from
  call.inputValues = [
    new ethereum.EventParam(
      'amounts',
      ethereum.Value.fromUnsignedBigIntArray(amounts)
    ),
    new ethereum.EventParam(
      'pools',
      ethereum.Value.fromAddressArray(poolAddresses)
    ),
  ]
  return changetype<NotifyPoolsCall>(call)
}

export function mockAddVaultAndStrategyCall(
  vault: Address,
  strategy: Address
): AddVaultAndStrategyCall {
  let to = Address.fromString('0x222412af183bceadefd72e4cb1b71f1889953b1c')
  let from = Address.fromString('0x0000000000000000000000000000000000000001')
  let call = newMockCall()
  call.to = to
  call.from = from
  call.inputValues = [
    new ethereum.EventParam('vault', ethereum.Value.fromAddress(vault)),
    new ethereum.EventParam('strategy', ethereum.Value.fromAddress(strategy)),
  ]

  return changetype<AddVaultAndStrategyCall>(call)
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

export function createDeploymentCompletedEvent(
  id: string
): DeploymentCompletedEvent {
  let mockEvent = newMockEvent()

  let event = new DeploymentCompletedEvent(
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
    new ethereum.EventParam('id', ethereum.Value.fromString(id)),
  ]

  return event
}

export { mocking, asserting }

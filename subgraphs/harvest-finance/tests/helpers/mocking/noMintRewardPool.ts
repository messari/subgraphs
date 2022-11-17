import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction, newMockEvent } from 'matchstick-as'
import {
  Staked as StakedEvent,
  Withdrawn as WithdrawnEvent,
} from '../../../generated/templates/NoMintRewardPool/NoMintRewardPool'

export function noMintRewardPool(
  contractAddress: Address,
  rewardTokenAddress: Address,
  sourceVault: Address
): void {
  createMockedFunction(
    contractAddress,
    'rewardToken',
    'rewardToken():(address)'
  ).returns([ethereum.Value.fromAddress(rewardTokenAddress)])

  createMockedFunction(
    contractAddress,
    'sourceVault',
    'sourceVault():(address)'
  ).returns([ethereum.Value.fromAddress(sourceVault)])
}

export function createStakedEvent(
  poolAddress: Address,
  user: Address,
  amount: BigInt
): StakedEvent {
  let mockEvent = newMockEvent()

  let event = new StakedEvent(
    poolAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user)),
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ]

  return event
}

export function createWithdrawnEvent(
  poolAddress: Address,
  user: Address,
  amount: BigInt
): WithdrawnEvent {
  let mockEvent = newMockEvent()

  let event = new WithdrawnEvent(
    poolAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  )

  event.parameters = [
    new ethereum.EventParam('user', ethereum.Value.fromAddress(user)),
    new ethereum.EventParam(
      'amount',
      ethereum.Value.fromUnsignedBigInt(amount)
    ),
  ]

  return event
}

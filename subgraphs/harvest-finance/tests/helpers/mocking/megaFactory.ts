import { Address, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction, newMockEvent } from 'matchstick-as'
import { DeploymentCompleted as DeploymentCompletedEvent } from '../../../generated/MegaFactory/MegaFactory'

export function megaFactory(
  contractAddress: Address,
  tokenAddress: Address,
  poolAddress: Address,
  vaultAddress: Address,
  strategyAddress: Address,
  id: string
): void {
  createMockedFunction(
    contractAddress,
    'completedDeployments',
    'completedDeployments(string):(uint8,address,address,address,address)'
  )
    .withArgs([ethereum.Value.fromString(id)])
    .returns([
      ethereum.Value.fromI32(0),
      ethereum.Value.fromAddress(tokenAddress),
      ethereum.Value.fromAddress(vaultAddress),
      ethereum.Value.fromAddress(strategyAddress),
      ethereum.Value.fromAddress(poolAddress),
    ])
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

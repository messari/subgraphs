import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as'
import { SharePriceChangeLog as SharePriceChangeLogEvent } from '../../../generated/Controller/ControllerContract'

export function createSharePriceChangeLogEvent(
  vault: Address,
  strategy: Address,
  oldSharePrice: BigInt,
  newSharePrice: BigInt,
  timestamp: BigInt
): SharePriceChangeLogEvent {
  let mockEvent = newMockEvent()

  let event = new SharePriceChangeLogEvent(
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
    new ethereum.EventParam('vault', ethereum.Value.fromAddress(vault)),
    new ethereum.EventParam('strategy', ethereum.Value.fromAddress(strategy)),
    new ethereum.EventParam(
      'oldSharePrice',
      ethereum.Value.fromUnsignedBigInt(oldSharePrice)
    ),
    new ethereum.EventParam(
      'newSharePrice',
      ethereum.Value.fromUnsignedBigInt(newSharePrice)
    ),
    new ethereum.EventParam(
      'timestamp',
      ethereum.Value.fromUnsignedBigInt(timestamp)
    ),
  ]

  return event
}

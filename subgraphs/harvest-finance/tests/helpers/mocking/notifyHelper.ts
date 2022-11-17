import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction, newMockCall } from 'matchstick-as'
import { NotifyPoolsCall } from '../../../generated/NotifyHelper/NotifyHelper'

export function notifyPools(
  contractAddress: Address,
  amounts: BigInt[],
  poolAddresses: Address[]
): void {
  createMockedFunction(
    contractAddress,
    'notifyPools',
    'notifyPools(uint256[],address[],uint256)'
  ).withArgs([
    ethereum.Value.fromUnsignedBigIntArray(amounts),
    ethereum.Value.fromAddressArray(poolAddresses),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
  ])

  createMockedFunction(
    contractAddress,
    'notifyPoolsIncludingProfitShare',
    'notifyPoolsIncludingProfitShare(uint256[],address[],uint256,uint256,uint256)'
  ).withArgs([
    ethereum.Value.fromUnsignedBigIntArray(amounts),
    ethereum.Value.fromAddressArray(poolAddresses),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
  ])
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

import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

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

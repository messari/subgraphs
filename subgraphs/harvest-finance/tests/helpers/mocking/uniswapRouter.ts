import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function getAmountsOut(
  address: Address,
  amountIn: BigInt,
  path: Address[],
  amountOut: BigInt
): void {
  createMockedFunction(
    address,
    'getAmountsOut',
    'getAmountsOut(uint256,address[]):(uint256[])'
  )
    .withArgs([
      ethereum.Value.fromUnsignedBigInt(amountIn),
      ethereum.Value.fromAddressArray(path),
    ])
    .returns([ethereum.Value.fromUnsignedBigIntArray([amountIn, amountOut])])
}

export function factory(
  contractAddress: Address,
  address: Address = Address.zero(),
  revert: bool = false
): void {
  if (revert) {
    createMockedFunction(
      contractAddress,
      'factory',
      'factory():(address)'
    ).reverts()
    return
  }
  createMockedFunction(
    contractAddress,
    'factory',
    'factory():(address)'
  ).returns([ethereum.Value.fromAddress(address)])
}

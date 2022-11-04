import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

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

import { Address, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function potPool(
  contractAddress: Address,
  rewardTokenAddress: Address
): void {
  createMockedFunction(
    contractAddress,
    'rewardToken',
    'rewardToken():(address)'
  ).returns([ethereum.Value.fromAddress(rewardTokenAddress)])
}

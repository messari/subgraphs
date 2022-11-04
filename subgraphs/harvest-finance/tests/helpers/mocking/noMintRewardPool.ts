import { Address, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

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

import { Address, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function megaFactory(
  contractAddress: Address,
  tokenAddress: Address,
  poolAddress: Address,
  vaultAddress: Address,
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
      ethereum.Value.fromAddress(
        Address.fromString('0x0000000000000000000000000000000000000000')
      ),
      ethereum.Value.fromAddress(poolAddress),
    ])
}

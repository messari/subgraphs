import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function chainLink(
  contractAddress: Address,
  baseAddress: Address,
  quoteAddress: Address,
  value: BigInt,
  decimals: u8
): void {
  createMockedFunction(
    contractAddress,
    'latestRoundData',
    'latestRoundData(address,address):(uint80,int256,uint256,uint256,uint80)'
  )
    .withArgs([
      ethereum.Value.fromAddress(baseAddress),
      ethereum.Value.fromAddress(quoteAddress),
    ])
    .returns([
      ethereum.Value.fromI32(0),
      ethereum.Value.fromUnsignedBigInt(value),
      ethereum.Value.fromI32(0),
      ethereum.Value.fromI32(0),
      ethereum.Value.fromI32(0),
    ])

  createMockedFunction(
    contractAddress,
    'decimals',
    'decimals(address,address):(uint8)'
  )
    .withArgs([
      ethereum.Value.fromAddress(baseAddress),
      ethereum.Value.fromAddress(quoteAddress),
    ])
    .returns([ethereum.Value.fromI32(decimals)])
}

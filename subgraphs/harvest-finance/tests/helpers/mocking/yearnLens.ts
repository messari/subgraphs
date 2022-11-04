import { Address, ethereum, BigInt } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function getPriceUsdcRecommended(
  address: Address,
  tokenAddress: Address,
  usdcValue: BigInt
): void {
  createMockedFunction(
    address,
    'getPriceUsdcRecommended',
    'getPriceUsdcRecommended(address):(uint256)'
  )
    .withArgs([ethereum.Value.fromAddress(tokenAddress)])
    .returns([ethereum.Value.fromUnsignedBigInt(usdcValue)])
}

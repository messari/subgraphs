import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export namespace helpers {
  export function toStringArray(array: string[]): string {
    return '[' + array.toString() + ']'
  }

  function mockReserves(contractAddress: Address, reserves: BigInt[]): void {
    createMockedFunction(
      contractAddress,
      'getReserves',
      'getReserves():(uint112,uint112,uint32)'
    ).returns([
      ethereum.Value.fromUnsignedBigInt(reserves[0]),
      ethereum.Value.fromUnsignedBigInt(reserves[1]),
      ethereum.Value.fromUnsignedBigInt(reserves[2]),
    ])
  }

  function mockToken0(contractAddress: Address, token: Address): void {
    createMockedFunction(
      contractAddress,
      'token0',
      'token0():(address)'
    ).returns([ethereum.Value.fromAddress(token)])
  }

  function mockToken1(contractAddress: Address, token: Address): void {
    createMockedFunction(
      contractAddress,
      'token1',
      'token1():(address)'
    ).returns([ethereum.Value.fromAddress(token)])
  }

  function mockTotalSupply(contractAddress: Address, amount: BigInt): void {
    createMockedFunction(
      contractAddress,
      'totalSupply',
      'totalSupply():(uint256)'
    ).returns([ethereum.Value.fromUnsignedBigInt(amount)])
  }

  export function mockDecimals(contractAddress: Address, decimals: u8): void {
    createMockedFunction(
      contractAddress,
      'decimals',
      'decimals():(uint8)'
    ).returns([ethereum.Value.fromI32(decimals)])
  }

  export function mockUniswapPair(
    contractAddress: Address,
    token0: Address,
    token1: Address,
    reserve0: BigInt,
    reserve1: BigInt,
    reserve2: BigInt,
    decimals: u8,
    totalSupply: BigInt
  ): void {
    mockToken0(contractAddress, token0)
    mockToken1(contractAddress, token1)
    mockReserves(contractAddress, [reserve0, reserve1, reserve2])
    mockDecimals(contractAddress, decimals)
    mockTotalSupply(contractAddress, totalSupply)
  }

  export function mockUniswapRouter(
    contractAddress: Address,
    amountIn: BigInt,
    path: Address[],
    amountOut: BigInt
  ): void {
    createMockedFunction(
      contractAddress,
      'getAmountsOut',
      'getAmountsOut(uint256,address[]):(uint256[])'
    )
      .withArgs([
        ethereum.Value.fromUnsignedBigInt(amountIn),
        ethereum.Value.fromAddressArray(path),
      ])
      .returns([ethereum.Value.fromUnsignedBigIntArray([amountIn, amountOut])])
  }
}

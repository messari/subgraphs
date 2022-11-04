import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'
import { decimals } from './erc20'

function reserves(contractAddress: Address, reserves: BigInt[]): void {
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

function token0(contractAddress: Address, token: Address): void {
  createMockedFunction(contractAddress, 'token0', 'token0():(address)').returns(
    [ethereum.Value.fromAddress(token)]
  )
}

function token1(contractAddress: Address, token: Address): void {
  createMockedFunction(contractAddress, 'token1', 'token1():(address)').returns(
    [ethereum.Value.fromAddress(token)]
  )
}

function totalSupply(contractAddress: Address, amount: BigInt): void {
  createMockedFunction(
    contractAddress,
    'totalSupply',
    'totalSupply():(uint256)'
  ).returns([ethereum.Value.fromUnsignedBigInt(amount)])
}

export function uniswapPair(
  contractAddress: Address,
  _token0: Address,
  _token1: Address,
  reserve0: BigInt,
  reserve1: BigInt,
  reserve2: BigInt,
  _decimals: u8,
  _totalSupply: BigInt
): void {
  token0(contractAddress, _token0)
  token1(contractAddress, _token1)
  reserves(contractAddress, [reserve0, reserve1, reserve2])
  decimals(contractAddress, _decimals)
  totalSupply(contractAddress, _totalSupply)
}

import { Address, ethereum } from '@graphprotocol/graph-ts'
import { createMockedFunction } from 'matchstick-as'

export function name(address: Address, name: string): void {
  createMockedFunction(address, 'name', 'name():(string)').returns([
    ethereum.Value.fromString(name),
  ])
}

export function symbol(address: Address, symbol: string): void {
  createMockedFunction(address, 'symbol', 'symbol():(string)').returns([
    ethereum.Value.fromString(symbol),
  ])
}

export function decimals(address: Address, decimals: u8): void {
  createMockedFunction(address, 'decimals', 'decimals():(uint8)').returns([
    ethereum.Value.fromI32(decimals),
  ])
}

export function erc20(
  address: Address,
  _name: string,
  _symbol: string,
  _decimals: u8
): void {
  name(address, _name)
  symbol(address, _symbol)
  decimals(address, _decimals)
}

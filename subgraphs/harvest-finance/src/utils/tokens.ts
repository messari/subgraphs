import { Address } from '@graphprotocol/graph-ts'
import { ERC20Contract } from '../../generated/Controller/ERC20Contract'
import { Token } from '../../generated/schema'

export namespace tokens {
  class TokenData {
    name: string
    symbol: string
    decimals: i32

    constructor(name: string, symbol: string, decimal: i32) {
      this.name = name
      this.symbol = symbol
      this.decimals = decimal
    }
  }

  class Result<T> {
    public value: T

    constructor(value: T) {
      this.value = value
    }
  }

  export function extractDecimals(address: Address): Result<u8> | null {
    const contract = ERC20Contract.bind(address)
    const decimalsCall = contract.try_decimals()

    if (decimalsCall.reverted) return null

    return new Result(decimalsCall.value as u8)
  }

  export function getData(address: Address): TokenData | null {
    const contract = ERC20Contract.bind(address)
    const nameCall = contract.try_name()
    const symbolCall = contract.try_symbol()
    const decimalsCall = contract.try_decimals()

    if (nameCall.reverted) return null
    if (symbolCall.reverted) return null
    if (decimalsCall.reverted) return null

    return new TokenData(nameCall.value, symbolCall.value, decimalsCall.value)
  }

  export function findOrInitialize(address: Address): Token {
    const id = address.toHexString()

    let token = Token.load(id)

    if (token) return token

    return initialize(id)
  }

  export function initialize(id: string): Token {
    const token = new Token(id)

    token.name = ''
    token.symbol = ''
    token.decimals = 0

    return token
  }
}

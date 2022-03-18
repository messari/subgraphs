import { Address } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../generated/MainRegistry/ERC20'

import { Token } from '../../generated/schema'
import { DEFAULT_DECIMALS, ZERO_ADDRESS } from './constant'


class TokenInfo {
  constructor(readonly name: string | null, readonly symbol: string | null, readonly decimals: i32) {}
}

export function getOrCreateToken(address: Address): Token {
  // Check if token already exist
  let token = Token.load(address.toHexString())

  // If token doesn't exist, create a new token
  if (token == null && address !== Address.fromString(ZERO_ADDRESS)) {
    token = new Token(address.toHexString())
    
    let tokenInstance = ERC20.bind(address)
    let tryName = tokenInstance.try_name();
    if (!tryName.reverted) {
      token.name = tryName.value;
    }
    let trySymbol = tokenInstance.try_symbol();
    if (!trySymbol.reverted) {
      token.symbol = trySymbol.value;
    }
    let tryDecimals = tokenInstance.try_decimals();
    if (!tryDecimals.reverted) {
      token.decimals = tryDecimals.value;
    }

    token.save()
    return token as Token
  }

  return token as Token
}



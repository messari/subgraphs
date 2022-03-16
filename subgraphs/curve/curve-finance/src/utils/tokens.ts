import { Address, ethereum } from '@graphprotocol/graph-ts'

import { ERC20 } from '../../generated/MainRegistry/ERC20'

import { Token } from '../../generated/schema'
import { ETH_TOKEN_ADDRESS, DEFAULT_DECIMALS } from './constant'


class TokenInfo {
  constructor(readonly name: string, readonly symbol: string, readonly decimals: i32) {}
}

export function getOrCreateToken(address: Address, event: ethereum.Event): Token {
  // Check if token already exist
  let token = Token.load(address.toString())

  // If token doesn't exist, create a new token
  if (token == null) {
    token = new Token(address.toString())
    
    // Check if address is the eth address 
    if (token.id == ETH_TOKEN_ADDRESS) {
      token.name = 'Ether'
      token.symbol = 'ETH'
      token.decimals = DEFAULT_DECIMALS
    } else {
      let info = getTokenInfo(address)

      token.name = info.name
      token.symbol = info.symbol
      token.decimals = info.decimals

    }

    token.save()
  }

  return token!
}

// Get token info for ERC20 tokens
function getTokenInfo(address: Address): TokenInfo {
  let erc20 = ERC20.bind(address)

  let name = erc20.name()
  let symbol = erc20.name()
  let decimals = erc20.try_decimals()

  return new TokenInfo(
    name,
    symbol,
    decimals.reverted ? 18 : decimals.value,
  )
}


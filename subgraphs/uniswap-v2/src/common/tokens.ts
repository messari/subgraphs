// import { log } from "@graphprotocol/graph-ts"
import { ERC20 } from '../../generated/Factory/ERC20'
import { Address } from '@graphprotocol/graph-ts'
import { DEFAULT_DECIMALS } from '../common/constants'
import { Token } from '../../generated/schema'

export function getOrCreateToken(address: Address): Token {
  let id = address.toHexString();
  let token = Token.load(id);
  if (!token) {
    token = new Token(id);
    let erc20Contract = ERC20.bind(address);
    let decimals = erc20Contract.try_decimals();
    // Using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();
    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? '' : name.value;
    token.symbol = symbol.reverted ? '' : symbol.value;
    token.save();
  }
  return token as Token;
}

export function getOrCreateLPToken(tokenAddress: Address, token0: Token, token1: Token): Token {
  let id = tokenAddress.toHexString();
  let token = Token.load(id)
  // fetch info if null
  if (token === null) {
      token = new Token(tokenAddress.toHexString())
      token.symbol = token0.name + '/' + token1.name
      token.name = token0.name + '/' + token1.name + " LP"
      token.decimals = DEFAULT_DECIMALS
      token.save()
  }
  return token
}

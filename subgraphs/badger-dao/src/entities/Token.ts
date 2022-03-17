import { Address } from '@graphprotocol/graph-ts';
import { Token } from '../../generated/schema';

export function ensureToken(id: Address): Token {
  let token = Token.load(id.toHex());

  if (token) {
    return token;
  }

  token = new Token(id.toHex());

  token.name = '';
  token.symbol = '';
  token.decimals = 18;
  token.save();

  return token;
}

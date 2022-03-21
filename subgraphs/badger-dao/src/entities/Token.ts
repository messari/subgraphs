import { Address } from '@graphprotocol/graph-ts';
import { RewardToken, Token } from '../../generated/schema';

export function getOrCreateToken(id: Address): Token {
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

export function getOrCreateReward(id: Address): RewardToken {
  let token = RewardToken.load(id.toHex());

  if (token) {
    return token;
  }

  token = new RewardToken(id.toHex());

  token.name = '';
  token.symbol = '';
  token.decimals = 18;
  token.type = 'DEPOSIT';
  token.save();

  return token;
}

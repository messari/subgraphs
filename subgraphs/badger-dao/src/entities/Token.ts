import { Address } from '@graphprotocol/graph-ts';
import { RewardToken, Token } from '../../generated/schema';
import { DEFAULT_DECIMALS } from '../constant';

export function getOrCreateToken(id: Address): Token {
  let token = Token.load(id.toHex());

  if (token) {
    return token;
  }

  token = new Token(id.toHex());

  token.name = '';
  token.symbol = '';
  token.decimals = DEFAULT_DECIMALS;
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
  token.decimals = DEFAULT_DECIMALS;
  token.type = 'DEPOSIT';
  token.save();

  return token;
}

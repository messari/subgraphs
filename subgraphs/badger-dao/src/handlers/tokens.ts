import { Address } from '@graphprotocol/graph-ts';
import { RewardToken, Token } from '../../generated/schema';
import { Harvest } from '../../generated/templates/BadgerStrategy/BadgerStrategy';
import { ERC20, Transfer } from '../../generated/templates/Token/ERC20';
import { getOrCreateReward, getOrCreateToken } from '../entities/Token';
import { readValue } from '../utils/contracts';

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex());

  if (!token) {
    createToken(event.address);
  }
}

export function handleReward(event: Harvest): void {
  let token = RewardToken.load(event.address.toHex());

  if (!token) {
    createRewardToken(event.address);
  }
}

function createToken(address: Address): void {
  let token = getOrCreateToken(address);
  let contract = ERC20.bind(address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), 18);

  token.save();
}

function createRewardToken(address: Address): void {
  let token = getOrCreateReward(address);
  let contract = ERC20.bind(address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), 18);

  token.save();
}

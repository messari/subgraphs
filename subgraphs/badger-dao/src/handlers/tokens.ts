import { Harvest } from '../../generated/templates/BadgerStrategy/BadgerStrategy';
import { ERC20, Transfer } from '../../generated/templates/Token/ERC20';
import { getOrCreateReward, getOrCreateToken } from '../entities/Token';
import { readValue } from '../utils/contracts';

export function handleTransfer(event: Transfer): void {
  let token = getOrCreateToken(event.address);
  let contract = ERC20.bind(event.address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), 18);

  token.save();
}

export function handleReward(event: Harvest): void {
  let token = getOrCreateReward(event.address);
  let contract = ERC20.bind(event.address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), 18);

  token.save();
}

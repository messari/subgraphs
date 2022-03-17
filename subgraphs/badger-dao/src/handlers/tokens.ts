import { ERC20, Transfer } from '../../generated/templates/Token/ERC20';
import { ensureToken } from '../entities/Token';
import { readValue } from '../utils/contracts';

export function handleTransfer(event: Transfer): void {
  let token = ensureToken(event.address);
  let contract = ERC20.bind(event.address);

  token.name = readValue<string>(contract.try_name(), '');
  token.symbol = readValue<string>(contract.try_symbol(), '');
  token.decimals = readValue<i32>(contract.try_decimals(), 18);

  token.save();
}

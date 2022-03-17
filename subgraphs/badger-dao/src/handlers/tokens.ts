import { Token } from '../../generated/schema';
import { ERC20, Transfer } from '../../generated/templates/Token/ERC20';
import { readValue } from '../utils/contracts';

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex());
  if (!token) {
    let contract = ERC20.bind(event.address);
    token = new Token(event.address.toHex());

    token.name = readValue<string>(contract.try_name(), '');
    token.symbol = readValue<string>(contract.try_symbol(), '');
    token.decimals = readValue<i32>(contract.try_decimals(), 18);
    token.save();
  }
}

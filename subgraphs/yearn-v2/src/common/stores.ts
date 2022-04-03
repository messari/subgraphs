import { Address, log } from '@graphprotocol/graph-ts';
import { _Account } from '../../generated/schema';

export function getOrCreateAccount(address: Address): _Account {
  let id = address.toHexString();
  let account = _Account.load(id);

  if (account == null) {
    account = new _Account(id);
    account.save();
  }

  return account;
}

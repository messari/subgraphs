import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../../generated/schema";
import { INT_ZERO } from "../constants";

export function getOrCreateAccount(address: Address): Account {
  let account = Account.load(address);
  if (!account) {
    account = new Account(address);
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.swapCount = INT_ZERO;
    account._newUser = true;

    return account;
  }
  account._newUser = false;

  return account;
}

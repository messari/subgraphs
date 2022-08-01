import { ethereum } from "@graphprotocol/graph-ts";

import {
  Account,
  AccountBalance,
  AccountBalanceDailySnapshot,
} from "../../generated/schema";
import { BIGINT_ZERO, SECONDS_PER_DAY } from "../common/constants";

export function getOrCreateAccount(accountAddress: string): Account {
  let existingAccount = Account.load(accountAddress);

  if (existingAccount != null) {
    return existingAccount as Account;
  }

  let newAccount = new Account(accountAddress);
  newAccount.tokenCount = BIGINT_ZERO;

  return newAccount;
}

export function getOrCreateAccountBalance(
  account: string,
  collection: string
): AccountBalance {
  let balanceId = account + "-" + collection;
  let previousBalance = AccountBalance.load(balanceId);

  if (previousBalance != null) {
    return previousBalance as AccountBalance;
  }

  let newBalance = new AccountBalance(balanceId);
  newBalance.account = account;
  newBalance.collection = collection;
  newBalance.tokenCount = BIGINT_ZERO;

  return newBalance;
}

export function updateAccountBalanceDailySnapshot(
  balance: AccountBalance,
  event: ethereum.Event
): void {
  let snapshot = getOrCreateAccountBalanceDailySnapshot(balance, event.block);

  snapshot.tokenCount = balance.tokenCount;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

function getOrCreateAccountBalanceDailySnapshot(
  balance: AccountBalance,
  block: ethereum.Block
): AccountBalanceDailySnapshot {
  let snapshotId =
    balance.account +
    "-" +
    balance.collection +
    "-" +
    (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let previousSnapshot = AccountBalanceDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as AccountBalanceDailySnapshot;
  }

  let newSnapshot = new AccountBalanceDailySnapshot(snapshotId);
  newSnapshot.account = balance.account;
  newSnapshot.collection = balance.collection;
  newSnapshot.tokenCount = balance.tokenCount;

  return newSnapshot;
}

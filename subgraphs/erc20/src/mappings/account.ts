import { BigDecimal, Bytes, ethereum, BigInt } from "@graphprotocol/graph-ts";

import {
  Account,
  AccountBalance,
  AccountBalanceDailySnapshot,
  Token,
} from "../../generated/schema";

import { BIGDECIMAL_ZERO, SECONDS_PER_DAY } from "../common/constants";

export function isNewAccount(accountAddress: Bytes): bool {
  let accountId = accountAddress.toHex();
  let existingAccount = Account.load(accountId);

  if (existingAccount != null) {
    return false;
  }

  return true;
}

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress.toHex();
  let existingAccount = Account.load(accountId);

  if (existingAccount != null) {
    return existingAccount as Account;
  }

  let newAccount = new Account(accountId);

  return newAccount;
}

export function getOrCreateAccountBalance(
  account: Account,
  token: Token
): AccountBalance {
  let balanceId = account.id + "-" + token.id;
  let previousBalance = AccountBalance.load(balanceId);

  if (previousBalance != null) {
    return previousBalance as AccountBalance;
  }

  let newBalance = new AccountBalance(balanceId);
  newBalance.account = account.id;
  newBalance.token = token.id;
  newBalance.amount = BIGDECIMAL_ZERO;

  return newBalance;
}

export function increaseAccountBalance(
  account: Account,
  token: Token,
  amount: BigDecimal
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.plus(amount);

  return balance;
}

export function decreaseAccountBalance(
  account: Account,
  token: Token,
  amount: BigDecimal
): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.minus(amount);
  if (balance.amount < BIGDECIMAL_ZERO) {
    balance.amount = BIGDECIMAL_ZERO;
  }

  return balance;
}

export function updateAccountBalanceDailySnapshot(
  balance: AccountBalance,
  event: ethereum.Event
): void {
  let snapshot = getOrCreateAccountBalanceDailySnapshot(balance, event.block);

  snapshot.amount = balance.amount;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function getOrCreateAccountBalanceDailySnapshot(
  balance: AccountBalance,
  block: ethereum.Block
): AccountBalanceDailySnapshot {
  let snapshotId =
    balance.account +
    "-" +
    balance.token +
    "-" +
    (block.timestamp.toI64() / SECONDS_PER_DAY).toString();
  let previousSnapshot = AccountBalanceDailySnapshot.load(snapshotId);

  if (previousSnapshot != null) {
    return previousSnapshot as AccountBalanceDailySnapshot;
  }

  let newSnapshot = new AccountBalanceDailySnapshot(snapshotId);
  newSnapshot.account = balance.account;
  newSnapshot.token = balance.token;

  return newSnapshot;
}

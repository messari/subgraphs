import { Address } from "@graphprotocol/graph-ts";
import { Account } from "../../generated/schema";
import { INT_ZERO } from "../utils/constants";
import {
  incrementProtocolUniqueBorrowers,
  incrementProtocolUniqueDepositors,
  incrementProtocolUniqueLiquidatees,
  incrementProtocolUniqueLiquidators,
  incrementProtocolUniqueUsers,
} from "./protocol";

export function getOrCreateAccount(address: Address): Account {
  const id = address.toHexString();
  let account = Account.load(id);
  if (!account) {
    account = new Account(id);
    account.positionCount = INT_ZERO;
    account.openPositions = [];
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.borrowCount = INT_ZERO;
    account.repayCount = INT_ZERO;
    account.liquidateCount = INT_ZERO;
    account.liquidationCount = INT_ZERO;
    account.save();
    incrementProtocolUniqueUsers();
  }
  return account;
}

export function incrementAccountDepositCount(account: Account): void {
  if (account.depositCount == 0) {
    incrementProtocolUniqueDepositors();
  }
  account.depositCount += 1;
  account.save();
}

export function incrementAccountWithdrawCount(account: Account): void {
  account.withdrawCount += 1;
  account.save();
}

export function incrementAccountBorrowCount(account: Account): void {
  if (account.borrowCount == 0) {
    incrementProtocolUniqueBorrowers();
  }
  account.borrowCount += 1;
  account.save();
}

export function incrementAccountRepayCount(account: Account): void {
  account.repayCount += 1;
  account.save();
}

export function incrementAccountLiquidatorCount(account: Account): void {
  if (account.liquidateCount == 0) {
    incrementProtocolUniqueLiquidators();
  }
  account.liquidateCount += 1;
  account.save();
}

export function incrementAccountLiquidationCount(account: Account): void {
  if (account.liquidationCount == 0) {
    incrementProtocolUniqueLiquidatees();
  }
  account.liquidationCount += 1;
  account.save();
}

import { Account } from "../../generated/schema";
import { BI } from "../utils/const";

export function getOrCreateAccount(id: string): Account {
  let account = Account.load(id);
  if (!account) {
    account = new Account(id);
    account.borrowCount = 0;
    account.depositCount = 0;
    account.withdrawCount = 0;
    account.repayCount = 0;
    account.liquidateCount = 0;
    account.liquidationCount = 0;
    account.positionCount = 0;
    account.closedPositionCount = 0;
    account.openPositionCount = 0;
    account._lastActiveTimestamp = BI("0");
    account.save();
  }
  return account;
}

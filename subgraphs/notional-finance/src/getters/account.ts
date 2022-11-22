import { Account } from "../../generated/schema";
import { getOrCreateLendingProtocol } from "./protocol";

export function getOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);

  if (!account) {
    account = new Account(accountId);
    account.positionCount = 0;

    account.openPositions = [];
    account.openPositionCount = 0;

    account.closedPositions = [];
    account.closedPositionCount = 0;

    account.depositCount = 0;
    account.withdrawCount = 0;
    account.borrowCount = 0;
    account.repayCount = 0;

    account.liquidateCount = 0;
    account.liquidationCount = 0;
    account.save();

    const protocol = getOrCreateLendingProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }

  return account;
}

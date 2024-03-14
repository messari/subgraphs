import { Bytes } from "@graphprotocol/graph-ts";

import { Account } from "../../generated/schema";
import { getProtocol } from "../initializers/protocol";

import { INT_ONE, INT_ZERO } from "./constants";

export class AccountManager {
  private _account: Account;

  constructor(account: Bytes) {
    let _account = Account.load(account);
    if (!_account) {
      _account = new Account(account);
      _account.positionCount = INT_ZERO;
      _account.openPositionCount = INT_ZERO;
      _account.closedPositionCount = INT_ZERO;
      _account.depositCount = INT_ZERO;
      _account.withdrawCount = INT_ZERO;
      _account.borrowCount = INT_ZERO;
      _account.repayCount = INT_ZERO;
      _account.liquidateCount = INT_ZERO;
      _account.liquidationCount = INT_ZERO;
      _account.transferredCount = INT_ZERO;
      _account.receivedCount = INT_ZERO;
      _account.flashloanCount = INT_ZERO;
      _account.save();

      const protocol = getProtocol();
      protocol.cumulativeUniqueUsers += INT_ONE;
      protocol.save();
    }
    this._account = _account;
  }

  getAccount(): Account {
    return this._account;
  }
}

import { Bytes } from "@graphprotocol/graph-ts";
import { Account } from "../../../../generated/schema";
import { INT_ONE, INT_ZERO } from "./constants";

/**
 * This file contains the AccountClass, which does
 * the operations on the Account entity. This includes:
 *  - Creating a new Account
 *  - Updating an existing Account
 *  - Making a position
 *  - Making position snapshots
 *
 * Schema Version:  3.1.1
 * SDK Version:     1.0.8
 * Author(s):
 *  - @melotik
 *  - @dhruv-chauhan
 */

export class AccountManager {
  private isNew: boolean; // true if the account was created
  private account: Account;

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
      this.isNew = true;
    } else {
      this.isNew = false;
    }
    this.account = _account;
  }

  getAccount(): Account {
    return this.account;
  }

  // returns true if the account was created in this instance
  isNewUser(): boolean {
    if (this.isNew) {
      return true;
    }

    // true if there have been no transactions submitted by the user
    // ie, liquidations and receives don't count (did not spend gas)
    return (
      this.account.depositCount == INT_ZERO &&
      this.account.withdrawCount == INT_ZERO &&
      this.account.borrowCount == INT_ZERO &&
      this.account.repayCount == INT_ZERO &&
      this.account.liquidateCount == INT_ZERO &&
      this.account.transferredCount == INT_ZERO &&
      this.account.flashloanCount == INT_ZERO
    );
  }

  countFlashloan(): void {
    this.account.flashloanCount += INT_ONE;
    this.account.save();
  }

  // Ensure this is called on the liquidators account
  countLiquidate(): void {
    this.account.liquidateCount += INT_ONE;
    this.account.save();
  }
}

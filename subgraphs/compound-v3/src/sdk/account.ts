import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  Account,
  LendingProtocol,
  Market,
  Position,
  PositionSnapshot,
  _PositionCounter,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  exponentToBigDecimal,
  INT_ONE,
  INT_ZERO,
  TransactionType,
} from "./constants";
import { TokenClass } from "./token";

/**
 * This file contains the AccountClass, which does
 * the operations on the Account entity. This includes:
 *  - Creating a new Account
 *  - Updating an existing Account
 *  - Making a position
 *  - Making position snapshots
 *
 * Schema Version: 3.0.0
 * Last Updated: Dec 4, 2022
 * Author(s):
 *  - @dmelotik
 */
export class AccountClass {
  private isNew!: boolean; // true if the account was created
  private account!: Account;
  private position!: Position;
  private market!: Market;
  private protocol!: LendingProtocol;
  private event!: ethereum.Event;

  constructor(
    account: Address,
    market: Market,
    protocol: LendingProtocol,
    event: ethereum.Event
  ) {
    this.market = market;
    this.protocol = protocol;
    this.event = event;
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

  // returns true if the account was created in this instance
  newAccount(): boolean {
    return this.isNew;
  }

  addPosition(
    asset: Bytes,
    newBalance: BigInt,
    side: string,
    transactionType: string,
    priceUSD: BigDecimal,
    interestType: string | null = null
  ): void {
    let counterID = this.account.id
      .toHexString()
      .concat("-")
      .concat(this.market.id.toHexString())
      .concat("-")
      .concat(side);
    if (interestType) {
      counterID = counterID.concat("-").concat(interestType);
    }
    let positionCounter = _PositionCounter.load(counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(counterID);
      positionCounter.nextCount = 0;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);
    const openPosition = position == null;
    if (openPosition) {
      position = new Position(positionID);
      position.account = this.account.id;
      position.market = this.market.id;
      position.asset = asset;
      position.hashOpened = this.event.transaction.hash;
      position.blockNumberOpened = this.event.block.number;
      position.timestampOpened = this.event.block.timestamp;
      position.side = side;
      if (interestType) {
        position.type = interestType;
      }
      position.balance = BIGINT_ZERO;
      position.depositCount = INT_ZERO;
      position.withdrawCount = INT_ZERO;
      position.borrowCount = INT_ZERO;
      position.repayCount = INT_ZERO;
      position.liquidationCount = INT_ZERO;
      position.transferredCount = INT_ZERO;
      position.receivedCount = INT_ZERO;
      position.save();
    }
    position = position!;
    position.balance = newBalance;
    if (transactionType == TransactionType.DEPOSIT) {
      position.depositCount += INT_ONE;
    } else if (transactionType == TransactionType.BORROW) {
      position.borrowCount += INT_ONE;
    } else if (transactionType == TransactionType.TRANSFER) {
      position.receivedCount += INT_ONE;
    }
    position.save();

    if (openPosition) {
      //
      // update account position
      //
      this.account.positionCount += 1;
      this.account.openPositionCount += 1;
      this.account.save();

      //
      // update market position
      //
      this.market.positionCount += 1;
      this.market.openPositionCount += 1;

      if (
        transactionType == TransactionType.DEPOSIT ||
        transactionType == TransactionType.TRANSFER
      ) {
        this.market.lendingPositionCount += 1;
      } else if (transactionType == TransactionType.BORROW) {
        this.market.borrowingPositionCount += 1;
      }
      this.market.save();

      //
      // update protocol position
      //
      this.protocol.cumulativePositionCount += 1;
      this.protocol.openPositionCount += 1;
      this.protocol.save();
    }
    this.position = position;

    //
    // take position snapshot
    //
    this.snapshotPosition(priceUSD);
  }

  subtractPosition(
    newBalance: BigInt,
    side: string,
    transactionType: string,
    priceUSD: BigDecimal,
    interestType: string | null = null
  ): void {
    let counterID = this.account.id
      .toHexString()
      .concat("-")
      .concat(this.market.id.toHexString())
      .concat("-")
      .concat(side);
    if (interestType) {
      counterID = counterID.concat("-").concat(interestType);
    }
    const positionCounter = _PositionCounter.load(counterID);
    if (!positionCounter) {
      log.warning("[subtractPosition] position counter {} not found", [
        counterID,
      ]);
      return;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());
    const position = Position.load(positionID);
    if (!position) {
      log.warning("[subtractPosition] position {} not found", [positionID]);
      return;
    }

    position.balance = newBalance;

    if (transactionType == TransactionType.WITHDRAW) {
      position.withdrawCount += INT_ONE;
    } else if (transactionType == TransactionType.REPAY) {
      position.repayCount += INT_ONE;
    } else if (transactionType == TransactionType.TRANSFER) {
      position.transferredCount += INT_ONE;
    } else if (transactionType == TransactionType.LIQUIDATE) {
      position.liquidationCount += INT_ONE;
    }
    position.save();

    const closePosition = position.balance == BIGINT_ZERO;
    if (closePosition) {
      //
      // update position counter
      //
      positionCounter.nextCount += INT_ONE;
      positionCounter.save();

      //
      // close position
      //
      position.hashClosed = this.event.transaction.hash;
      position.blockNumberClosed = this.event.block.number;
      position.timestampClosed = this.event.block.timestamp;
      position.save();

      //
      // update account position
      //
      this.account.openPositionCount -= INT_ONE;
      this.account.closedPositionCount += INT_ONE;
      this.account.save();

      //
      // update market position
      //
      this.market.openPositionCount -= INT_ONE;
      this.market.closedPositionCount += INT_ONE;
      this.market.save();

      //
      // update protocol position
      //
      this.protocol.openPositionCount -= INT_ONE;
      this.protocol.save();
    }
    this.position = position;

    //
    // update position snapshot
    //
    this.snapshotPosition(priceUSD);
  }

  getPositionID(): string {
    return this.position.id;
  }

  setCollateral(isCollateral: boolean): void {
    this.position.isCollateral = isCollateral;
    this.position.save();
  }

  setIsolation(isIsolated: boolean): void {
    this.position.isIsolated = isIsolated;
    this.position.save();
  }

  private snapshotPosition(priceUSD: BigDecimal): void {
    const snapshot = new PositionSnapshot(
      this.position.id
        .concat("-")
        .concat(this.event.transaction.hash.toHexString())
        .concat("-")
        .concat(this.event.logIndex.toString())
    );
    const token = new TokenClass(this.position.asset, this.event);
    const mantissaFactorBD = exponentToBigDecimal(token.getDecimals());
    snapshot.hash = this.event.transaction.hash;
    snapshot.logIndex = this.event.logIndex.toI32();
    snapshot.nonce = this.event.transaction.nonce;
    snapshot.position = this.position.id;
    snapshot.balance = this.position.balance;
    snapshot.balanceUSD = this.position.balance
      .toBigDecimal()
      .div(mantissaFactorBD)
      .times(priceUSD);
    snapshot.blockNumber = this.event.block.number;
    snapshot.timestamp = this.event.block.timestamp;
    snapshot.save();
  }
}

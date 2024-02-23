import { BigInt, log, ethereum } from "@graphprotocol/graph-ts";

import {
  Account,
  Market,
  Position,
  _PositionCounter,
  PositionSnapshot,
} from "../../generated/schema";
import { getProtocol } from "../initializers/protocol";
import { toAssetsDown, toAssetsUp } from "../maths/shares";

import {
  exponentToBigDecimal,
  INT_ZERO,
  PositionSide,
  SECONDS_PER_DAY,
  TransactionType,
} from "./constants";
import { SnapshotManager } from "./snapshots";
import { TokenManager } from "./token";

export class PositionManager {
  private _counterID: string;
  private _position: Position | null = null;
  private _market: Market;
  private _account: Account;
  private _side: string;

  constructor(account: Account, market: Market, side: string) {
    this._counterID = account.id
      .toHexString()
      .concat("-")
      .concat(market.id.toHexString())
      .concat("-")
      .concat(side);
    const positionCounter = _PositionCounter.load(this._counterID);
    if (positionCounter) {
      const positionID = positionCounter.id
        .concat("-")
        .concat(positionCounter.nextCount.toString());
      this._position = Position.load(positionID);
    }

    this._market = market;
    this._account = account;
    this._side = side;
  }

  getPosition(): Position | null {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      return null;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    return Position.load(positionID);
  }
  addCollateralPosition(
    event: ethereum.Event,
    amountSupplied: BigInt
  ): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(this._counterID);
      positionCounter.nextCount = 0;
      positionCounter.lastTimestamp = event.block.timestamp;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      position = this._createPosition(
        positionID,
        event,
        TransactionType.DEPOSIT_COLLATERAL
      );
    }

    position.balance = position.balance.plus(amountSupplied);
    position.principal = position.balance;
    position.depositCollateralCount += 1;
    position.depositCount += 1;

    position.save();

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }
  addSupplyPosition(event: ethereum.Event, sharesSupplied: BigInt): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(this._counterID);
      positionCounter.nextCount = 0;
      positionCounter.lastTimestamp = event.block.timestamp;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      position = this._createPosition(
        positionID,
        event,
        TransactionType.DEPOSIT_COLLATERAL
      );
    }

    const amountSupplied = toAssetsDown(
      sharesSupplied,
      this._market.totalSupplyShares,
      this._market.totalSupply
    );
    position.shares = position.shares
      ? position.shares!.plus(sharesSupplied)
      : sharesSupplied;

    const totalSupply = toAssetsDown(
      position.shares!,
      this._market.totalSupplyShares,
      this._market.totalSupply
    );

    position.balance = totalSupply;
    position.principal = position.principal
      ? position.principal!.plus(amountSupplied)
      : amountSupplied;
    position.depositCount += 1;
    position.save();

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }
  addBorrowPosition(event: ethereum.Event, sharesBorrowed: BigInt): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(this._counterID);
      positionCounter.nextCount = 0;
      positionCounter.lastTimestamp = event.block.timestamp;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      position = this._createPosition(
        positionID,
        event,
        TransactionType.BORROW
      );
    }

    const amountBorrowed = toAssetsUp(
      sharesBorrowed,
      this._market.totalBorrowShares,
      this._market.totalBorrow
    );
    position.shares = position.shares
      ? position.shares!.plus(sharesBorrowed)
      : sharesBorrowed;

    const totalBorrow = toAssetsUp(
      position.shares!,
      this._market.totalBorrowShares,
      this._market.totalBorrow
    );

    position.balance = totalBorrow;
    position.principal = position.principal
      ? position.principal!.plus(amountBorrowed)
      : amountBorrowed;
    position.borrowCount += 1;
    position.save();

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }

  reduceCollateralPosition(
    event: ethereum.Event,
    amountWithdrawn: BigInt
  ): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      log.critical("[subtractPosition] position counter {} not found", [
        this._counterID.toString(),
      ]);
      return this._position!;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      log.critical("[subtractPosition] position {} not found", [
        positionID.toString(),
      ]);
      return this._position!;
    }

    position.balance = position.balance.minus(amountWithdrawn);
    position.principal = position.balance;
    position.withdrawCount += 1;
    position.withdrawCollateralCount += 1;
    this._position = position;
    if (position.balance.equals(BigInt.zero())) {
      this._closePosition(position, event);
    }

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }
  reduceBorrowPosition(event: ethereum.Event, sharesRepaid: BigInt): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      log.critical("[subtractPosition] position counter {} not found", [
        this._counterID.toString(),
      ]);
      return this._position!;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      log.critical("[subtractPosition] position {} not found", [
        positionID.toString(),
      ]);
      return this._position!;
    }
    const amountRepaid = toAssetsDown(
      sharesRepaid,
      this._market.totalBorrowShares,
      this._market.totalBorrow
    );
    position.shares = position.shares!.minus(sharesRepaid);

    const totalBorrow = toAssetsUp(
      position.shares!,
      this._market.totalBorrowShares,
      this._market.totalBorrow
    );

    position.balance = totalBorrow;
    position.principal = position.principal!.minus(amountRepaid);
    position.repayCount += 1;
    this._position = position;
    if (position.shares!.equals(BigInt.zero())) {
      this._closePosition(position, event);
    }

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }

  reduceSupplyPosition(
    event: ethereum.Event,
    sharesWithdrawn: BigInt
  ): Position {
    let positionCounter = _PositionCounter.load(this._counterID);
    if (!positionCounter) {
      log.critical("[subtractPosition] position counter {} not found", [
        this._counterID.toString(),
      ]);
      return this._position!;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);

    if (!position) {
      log.critical("[subtractPosition] position {} not found", [
        positionID.toString(),
      ]);
      return this._position!;
    }
    const amountWithdrawn = toAssetsDown(
      sharesWithdrawn,
      this._market.totalSupplyShares,
      this._market.totalSupply
    );
    position.shares = position.shares!.minus(sharesWithdrawn);

    const totalSupply = toAssetsDown(
      position.shares!,
      this._market.totalSupplyShares,
      this._market.totalSupply
    );

    position.balance = totalSupply;
    position.principal = position.principal!.minus(amountWithdrawn);
    position.withdrawCount += 1;
    this._position = position;
    if (position.shares!.equals(BigInt.zero())) {
      this._closePosition(position, event);
    }

    this._position = position;

    // take position snapshot
    this._snapshotPosition(event);
    this._countDailyActivePosition(positionCounter, event);
    return this._position!;
  }

  private _snapshotPosition(event: ethereum.Event): void {
    const snapshot = new PositionSnapshot(
      this._position!.id.concat("-")
        .concat(event.transaction.hash.toHexString())
        .concat("-")
        .concat(event.logIndex.toString())
    );
    const token = new TokenManager(this._position!.asset, event);
    const mantissaFactorBD = exponentToBigDecimal(token.getDecimals());
    snapshot.hash = event.transaction.hash;
    snapshot.logIndex = event.logIndex.toI32();
    snapshot.nonce = event.transaction.nonce;
    snapshot.account = this._account.id;
    snapshot.position = this._position!.id;
    snapshot.balance = this._position!.balance;
    snapshot.balanceUSD = this._position!.balance.toBigDecimal()
      .div(mantissaFactorBD)
      .times(token.getPriceUSD());
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;

    if (this._position!.principal)
      snapshot.principal = this._position!.principal;
    if (
      this._market.borrowIndex &&
      this._position!.side == PositionSide.BORROWER
    ) {
      snapshot.index = this._market.borrowIndex;
    } else if (
      this._market.supplyIndex &&
      this._position!.side == PositionSide.COLLATERAL
    ) {
      snapshot.index = this._market.supplyIndex;
    }

    snapshot.save();
  }

  private _countDailyActivePosition(
    counter: _PositionCounter,
    event: ethereum.Event
  ): void {
    const lastDay = counter.lastTimestamp.toI32() / SECONDS_PER_DAY;
    const currentDay = event.block.timestamp.toI32() / SECONDS_PER_DAY;
    if (lastDay == currentDay) {
      return;
    }

    // this is a new active position
    const snapshots = new SnapshotManager(event, this._market);
    snapshots.addDailyActivePosition(this._side);

    counter.lastTimestamp = event.block.timestamp;
    counter.save();
  }

  _createPosition(
    positionID: string,
    event: ethereum.Event,
    transactionType: string
  ): Position {
    const position = new Position(positionID);
    position.account = this._account.id;
    position.market = this._market.id;

    position.asset =
      transactionType === TransactionType.DEPOSIT_COLLATERAL ||
      transactionType === TransactionType.WITHDRAW_COLLATERAL
        ? this._market.inputToken
        : this._market.borrowedToken;
    position.hashOpened = event.transaction.hash;
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = this._side;
    position.depositCount = INT_ZERO;
    position.depositCollateralCount = INT_ZERO;
    position.withdrawCollateralCount = INT_ZERO;
    position.withdrawCount = INT_ZERO;
    position.borrowCount = INT_ZERO;
    position.repayCount = INT_ZERO;
    position.liquidationCount = INT_ZERO;
    position.transferredCount = INT_ZERO;
    position.receivedCount = INT_ZERO;

    if (transactionType == TransactionType.DEPOSIT) {
      position.isCollateral = false;
      position.shares = BigInt.zero();
    } else if (transactionType === TransactionType.DEPOSIT_COLLATERAL) {
      position.isCollateral = true;
    }
    position.balance = BigInt.zero();
    position.save();

    // update account position
    this._account.positionCount += 1;
    this._account.openPositionCount += 1;
    this._account.save();

    // update market position
    this._market.positionCount += 1;
    this._market.openPositionCount += 1;
    if (transactionType === TransactionType.DEPOSIT) {
      this._market.lendingPositionCount += 1;
    } else if (transactionType == TransactionType.DEPOSIT_COLLATERAL) {
      this._market.lendingPositionCount += 1;
      this._market.collateralPositionCount += 1;
    } else if (transactionType == TransactionType.BORROW) {
      this._market.borrowingPositionCount += 1;
    } else {
      log.critical("[_createPosition] invalid transaction type {}", [
        transactionType,
      ]);
      return position;
    }
    this._market.save();

    // update protocol position
    const protocol = getProtocol();
    protocol.cumulativePositionCount += 1;
    protocol.openPositionCount += 1;
    protocol.save();
    return position;
  }

  private _closePosition(position: Position, event: ethereum.Event): void {
    position.hashClosed = event.transaction.hash;
    position.blockNumberClosed = event.block.number;
    position.timestampClosed = event.block.timestamp;
    position.save();

    // update account position
    this._account.openPositionCount -= 1;
    this._account.closedPositionCount += 1;
    this._account.save();

    // update market position
    this._market.openPositionCount -= 1;
    this._market.closedPositionCount += 1;
    if (position.isCollateral) {
      this._market.collateralPositionCount -= 1;
    }
    this._market.save();

    // update protocol position
    const protocol = getProtocol();
    protocol.openPositionCount -= 1;
    protocol.save();
  }
}

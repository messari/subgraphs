import {
  BigDecimal,
  Bytes,
  BigInt,
  log,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  Account,
  LendingProtocol,
  Market,
  Position,
  _PositionCounter,
  PositionSnapshot,
} from "../../generated/schema";
import {
  BIGINT_ZERO,
  exponentToBigDecimal,
  INT_ONE,
  INT_ZERO,
  SECONDS_PER_DAY,
  TransactionType,
} from "./constants";
import { SnapshotManager } from "./snapshots";
import { TokenManager } from "./token";
import { PositionSide } from "./constants";

/**
 * This file contains the PositionManager class, which is used to
 * make changes to a given position.
 *
 * Schema Version:  3.1.1
 * SDK Version:     1.0.8
 * Author(s):
 *  - @melotik
 *  - @dhruv-chauhan
 */

export class PositionManager {
  private counterID: string;
  private position: Position | null = null;
  private market: Market;
  private account: Account;
  private side: string;
  private interestType: string | null = null;

  constructor(
    account: Account,
    market: Market,
    side: string,
    interestType: string | null = null
  ) {
    this.counterID = account.id
      .toHexString()
      .concat("-")
      .concat(market.id.toHexString())
      .concat("-")
      .concat(side);
    if (interestType) {
      this.counterID = this.counterID.concat("-").concat(interestType);
    }
    const positionCounter = _PositionCounter.load(this.counterID);
    if (positionCounter) {
      const positionID = positionCounter.id
        .concat("-")
        .concat(positionCounter.nextCount.toString());
      this.position = Position.load(positionID);
    }

    this.market = market;
    this.account = account;
    this.side = side;
    this.interestType = interestType;
  }

  getPositionID(): string | null {
    if (this.position) {
      return this.position!.id;
    }
    return null;
  }

  _getPositionBalance(): BigInt | null {
    if (this.position) {
      return this.position!.balance;
    }
    return null;
  }

  setCollateral(isCollateral: boolean): void {
    if (this.position) {
      this.position!.isCollateral = isCollateral;
      this.position!.save();
    }
  }

  setIsolation(isIsolated: boolean): void {
    if (this.position) {
      this.position!.isIsolated = isIsolated;
      this.position!.save();
    }
  }

  addPosition(
    event: ethereum.Event,
    asset: Bytes,
    protocol: LendingProtocol,
    newBalance: BigInt,
    transactionType: string,
    priceUSD: BigDecimal,
    principal: BigInt | null = null
  ): string | null {
    let positionCounter = _PositionCounter.load(this.counterID);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(this.counterID);
      positionCounter.nextCount = 0;
      positionCounter.lastTimestamp = event.block.timestamp;
      positionCounter.save();
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());

    let position = Position.load(positionID);
    const openPosition = position == null;
    if (!openPosition) {
      // update existing position
      position = position!;
      position.balance = newBalance;
      if (principal) position.principal = principal;
      if (transactionType == TransactionType.DEPOSIT) {
        position.depositCount += INT_ONE;
      } else if (transactionType == TransactionType.BORROW) {
        position.borrowCount += INT_ONE;
      } else if (transactionType == TransactionType.TRANSFER) {
        position.receivedCount += INT_ONE;
      }
      // Note: liquidateCount is not incremented here
      position.save();
      this.position = position;

      //
      // take position snapshot
      //
      this.snapshotPosition(event, priceUSD);
      return null;
    }
    position = new Position(positionID);
    position.account = this.account.id;
    position.market = this.market.id;
    position.asset = asset;
    position.hashOpened = event.transaction.hash;
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = this.side;
    if (this.interestType) {
      position.type = this.interestType;
    }
    position.balance = newBalance;
    if (principal) position.principal = principal;
    position.depositCount = INT_ZERO;
    position.withdrawCount = INT_ZERO;
    position.borrowCount = INT_ZERO;
    position.repayCount = INT_ZERO;
    position.liquidationCount = INT_ZERO;
    position.transferredCount = INT_ZERO;
    position.receivedCount = INT_ZERO;

    if (transactionType == TransactionType.DEPOSIT) {
      position.depositCount += INT_ONE;
    } else if (transactionType == TransactionType.BORROW) {
      position.borrowCount += INT_ONE;
    } else if (transactionType == TransactionType.TRANSFER) {
      position.receivedCount += INT_ONE;
    }
    position.save();

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
    protocol.cumulativePositionCount += 1;
    protocol.openPositionCount += 1;
    protocol.save();

    this.position = position;

    //
    // take position snapshot
    //
    this.snapshotPosition(event, priceUSD);
    this.dailyActivePosition(positionCounter, event, protocol);
    return this.getPositionID();
  }

  subtractPosition(
    event: ethereum.Event,
    protocol: LendingProtocol,
    newBalance: BigInt,
    transactionType: string,
    priceUSD: BigDecimal,
    principal: BigInt | null = null
  ): string | null {
    const positionCounter = _PositionCounter.load(this.counterID);
    if (!positionCounter) {
      log.warning("[subtractPosition] position counter {} not found", [
        this.counterID,
      ]);
      return null;
    }
    const positionID = positionCounter.id
      .concat("-")
      .concat(positionCounter.nextCount.toString());
    const position = Position.load(positionID);
    if (!position) {
      log.warning("[subtractPosition] position {} not found", [positionID]);
      return null;
    }

    position.balance = newBalance;
    if (principal) position.principal = principal;

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
      position.hashClosed = event.transaction.hash;
      position.blockNumberClosed = event.block.number;
      position.timestampClosed = event.block.timestamp;
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
      protocol.openPositionCount -= INT_ONE;
      protocol.save();
    }
    this.position = position;

    //
    // update position snapshot
    //
    this.snapshotPosition(event, priceUSD);
    this.dailyActivePosition(positionCounter, event, protocol);
    return this.getPositionID();
  }

  private snapshotPosition(event: ethereum.Event, priceUSD: BigDecimal): void {
    const snapshot = new PositionSnapshot(
      this.position!.id.concat("-")
        .concat(event.transaction.hash.toHexString())
        .concat("-")
        .concat(event.logIndex.toString())
    );
    const token = new TokenManager(this.position!.asset, event);
    const mantissaFactorBD = exponentToBigDecimal(token.getDecimals());
    snapshot.hash = event.transaction.hash;
    snapshot.logIndex = event.logIndex.toI32();
    snapshot.nonce = event.transaction.nonce;
    snapshot.account = this.account.id;
    snapshot.position = this.position!.id;
    snapshot.balance = this.position!.balance;
    snapshot.balanceUSD = this.position!.balance.toBigDecimal()
      .div(mantissaFactorBD)
      .times(priceUSD);
    snapshot.blockNumber = event.block.number;
    snapshot.timestamp = event.block.timestamp;

    if (this.position!.principal) snapshot.principal = this.position!.principal;
    if (
      this.market.borrowIndex &&
      this.position!.side == PositionSide.BORROWER
    ) {
      snapshot.index = this.market.borrowIndex;
    } else if (
      this.market.supplyIndex &&
      this.position!.side == PositionSide.COLLATERAL
    ) {
      snapshot.index = this.market.supplyIndex;
    }

    snapshot.save();
  }

  private dailyActivePosition(
    counter: _PositionCounter,
    event: ethereum.Event,
    protocol: LendingProtocol
  ): void {
    const lastDay = counter.lastTimestamp.toI32() / SECONDS_PER_DAY;
    const currentDay = event.block.timestamp.toI32() / SECONDS_PER_DAY;
    if (lastDay == currentDay) {
      return;
    }

    // this is a new active position
    const snapshots = new SnapshotManager(event, protocol, this.market);
    snapshots.addDailyActivePosition(this.side);

    counter.lastTimestamp = event.block.timestamp;
    counter.save();
  }
}

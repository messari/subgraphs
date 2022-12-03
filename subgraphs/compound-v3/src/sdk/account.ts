import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Account, Position, _PositionCounter } from "../../generated/schema";
import { BIGINT_ZERO, INT_ONE, INT_ZERO, TransactionType } from "./constants";
import { MarketClass } from "./market";

export class AccountClass {
  private isNew!: boolean; // true if the account was created
  private account!: Account;
  private position!: Position;
  private market!: MarketClass;

  constructor(account: Address, market: MarketClass) {
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
    this.market = market;
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
    interestType: string | null = null
  ): void {
    const marketEntity = this.market.getMarket();
    const counterID = this.account.id
      .toHexString()
      .concat("-")
      .concat(marketEntity.id.toHexString())
      .concat("-")
      .concat(side);
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
      position.market = marketEntity.id;
      position.asset = asset;
      position.hashOpened = this.market.event.transaction.hash;
      position.blockNumberOpened = this.market.event.block.number;
      position.timestampOpened = this.market.event.block.timestamp;
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
      marketEntity.positionCount += 1;
      marketEntity.openPositionCount += 1;

      if (
        transactionType == TransactionType.DEPOSIT ||
        transactionType == TransactionType.TRANSFER
      ) {
        marketEntity.lendingPositionCount += 1;
      } else if (transactionType == TransactionType.BORROW) {
        marketEntity.borrowingPositionCount += 1;
      }
      marketEntity.save();

      //
      // update protocol position
      //
      this.market.protocol.cumulativePositionCount += 1;
      this.market.protocol.openPositionCount += 1;
      this.market.protocol.save();
    }
    this.position = position;

    //
    // take position snapshot
    //
    this.snapshotPosition();
  }

  subtractPosition(
    newBalance: BigInt,
    positionSide: string,
    transactionType: string
  ): void {}

  setCollateral(isCollateral: boolean): void {
    this.position.isCollateral = isCollateral;
    this.position.save();
  }

  setIsolation(isIsolated: boolean): void {
    this.position.isIsolated = isIsolated;
    this.position.save();
  }

  private snapshotPosition(): void {}
}

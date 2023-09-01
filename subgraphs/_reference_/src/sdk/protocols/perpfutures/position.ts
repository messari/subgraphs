import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { Pool } from "./pool";
import { Account } from "./account";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import * as constants from "../../util/constants";
import { addToArrayAtIndex } from "../../util/arrays";

import {
  Token,
  PositionSnapshot,
  _PositionCounter,
  Position as PositionSchema,
} from "../../../../generated/schema";

/**
 * This file contains the Position class, which is used to
 * make all of the storage changes that occur in the position and
 * its corresponding snapshots.
 *
 * Schema Version:  1.3.3
 * SDK Version:     1.1.7
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 *  - @dmelotik
 */

export class PositionManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  getPositionId(
    identifier: Bytes,
    pool: Pool,
    account: Account,
    asset: Token,
    positionSide: constants.PositionSide
  ): Bytes {
    const positionId = account
      .getBytesId()
      .concat(Bytes.fromUTF8("-"))
      .concat(pool.getBytesID())
      .concat(Bytes.fromUTF8("-"))
      .concat(asset.id)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromUTF8(positionSide));

    let positionCounter = _PositionCounter.load(positionId);
    if (!positionCounter) {
      positionCounter = new _PositionCounter(positionId);
      positionCounter.uniquePositions = [];
    }
    if (positionCounter.uniquePositions.indexOf(identifier) == -1) {
      addToArrayAtIndex(positionCounter.uniquePositions, identifier);
    }
    positionCounter.save();

    return positionId
      .concat(Bytes.fromUTF8("-"))
      .concatI32(positionCounter.uniquePositions.length);
  }

  loadPosition(
    identifier: Bytes,
    pool: Pool,
    account: Account,
    asset: Token,
    collateral: Token,
    positionSide: constants.PositionSide
  ): Position {
    const positionId = this.getPositionId(
      identifier,
      pool,
      account,
      asset,
      positionSide
    );

    let entity = PositionSchema.load(positionId);
    if (!entity) {
      entity = new PositionSchema(positionId);
      entity.account = account.getBytesId();
      entity.liquidityPool = pool.getBytesID();
      entity.collateral = collateral.id;
      entity.asset = asset.id;

      const event = this.protocol.getCurrentEvent();
      entity.hashOpened = event.transaction.hash;
      entity.blockNumberOpened = event.block.number;
      entity.timestampOpened = event.block.timestamp;

      entity.side = positionSide;
      entity.fundingrateOpen = constants.BIGDECIMAL_ZERO;
      entity.leverage = constants.BIGDECIMAL_ZERO;

      entity.balance = constants.BIGINT_ZERO;
      entity.balanceUSD = constants.BIGDECIMAL_ZERO;

      entity.collateralBalance = constants.BIGINT_ZERO;
      entity.collateralBalanceUSD = constants.BIGDECIMAL_ZERO;

      entity.collateralInCount = 0;
      entity.collateralOutCount = 0;
      entity.liquidationCount = 0;

      entity.save();
    }

    return new Position(this.protocol, this.tokens, pool, account, entity);
  }
}

export class Position {
  protocol: Perpetual;
  tokens: TokenManager;
  pool: Pool;
  account: Account;
  position: PositionSchema;

  constructor(
    protocol: Perpetual,
    tokens: TokenManager,
    pool: Pool,
    account: Account,
    position: PositionSchema
  ) {
    this.protocol = protocol;
    this.tokens = tokens;
    this.pool = pool;
    this.account = account;
    this.position = position;

    this.openPosition();
  }

  getBytesID(): Bytes {
    return this.position.id;
  }

  private save(): void {
    this.position.save();
    this.takePositionSnapshot();
  }

  openPosition(): void {
    this.account.openPosition(this.position.side);
    this.pool.openPosition(this.position.side);
    this.protocol.openPosition(this.position.side);
  }

  closePosition(): void {
    const event = this.protocol.getCurrentEvent();
    this.position.hashClosed = event.transaction.hash;
    this.position.blockNumberClosed = event.block.number;
    this.position.timestampClosed = event.block.timestamp;
    this.save();

    this.account.closePosition(this.position.side);
    this.pool.closePosition(this.position.side);
    this.protocol.closePosition(this.position.side);
  }

  /**
   * Sets the position's fundingrateOpen value.
   * @param amount
   */
  setFundingrateOpen(amount: BigDecimal): void {
    this.position.fundingrateOpen = amount;
    this.save();
  }

  /**
   * Sets the position's fundingrateClosed value.
   * @param amount
   */
  setFundingrateClosed(amount: BigDecimal): void {
    this.position.fundingrateClosed = amount;
    this.save();
  }

  /**
   * Sets the position's leverage value.
   * @param amount
   */
  setLeverage(amount: BigDecimal): void {
    this.position.leverage = amount;
    this.save();
  }

  /**
   * Sets the position's balance value.
   * @param token
   * @param amount
   */
  setBalance(token: Token, amount: BigInt): void {
    this.position.balance = amount;
    this.position.balanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    this.save();
  }

  /**
   * Sets the position's collateralBalance value.
   * @param token
   * @param amount
   */
  setCollateralBalance(token: Token, amount: BigInt): void {
    this.position.collateralBalance = amount;
    this.position.collateralBalanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    this.save();
  }

  /**
   * Sets the position's closeBalanceUSD value.
   * @param token
   * @param amount
   */
  setBalanceClosed(token: Token, amount: BigInt): void {
    this.position.closeBalanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    this.save();
  }

  /**
   * Sets the position's closeCollateralBalanceUSD value.
   * @param token
   * @param amount
   */
  setCollateralBalanceClosed(token: Token, amount: BigInt): void {
    this.position.closeCollateralBalanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    this.save();
  }

  /**
   * Sets the position's realisedPnlUSD value.
   * @param token
   * @param amount
   */
  setRealisedPnlClosed(token: Token, amount: BigInt): void {
    this.position.realisedPnlUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(token, amount);
    this.save();
  }

  /**
   * Adds 1 to the account position collateralIn count.
   */
  addCollateralInCount(): void {
    this.position.collateralInCount += 1;
    this.save();
  }

  /**
   * Adds 1 to the account position collateralOut count.
   */
  addCollateralOutCount(): void {
    this.position.collateralOutCount += 1;
    this.save();
  }

  /**
   * Adds 1 to the account position liquidation count.
   */
  addLiquidationCount(): void {
    this.position.liquidationCount += 1;
    this.save();
  }

  private takePositionSnapshot(): void {
    const event = this.protocol.getCurrentEvent();
    const snapshotId = this.position.id
      .concat(event.transaction.hash)
      .concat(Bytes.fromUTF8(event.transaction.index.toString()));
    const snapshot = new PositionSnapshot(snapshotId);

    snapshot.hash = event.transaction.hash;
    snapshot.logIndex = event.transaction.index.toI32();
    snapshot.nonce = event.transaction.nonce;

    snapshot.position = this.position.id;
    snapshot.account = this.position.account;
    snapshot.fundingrate = this.position.fundingrateOpen;
    snapshot.balance = this.position.balance;
    snapshot.collateralBalance = this.position.collateralBalance;
    snapshot.balanceUSD = this.position.balanceUSD;
    snapshot.collateralBalanceUSD = this.position.collateralBalanceUSD;
    snapshot.realisedPnlUSD = this.position.realisedPnlUSD;
    snapshot.blockNumber = this.protocol.event.block.number;
    snapshot.timestamp = this.protocol.event.block.timestamp;

    snapshot.save();
  }
}

import {
  Token,
  PositionSnapshot,
  _PositionCounter,
  Position as PositionSchema,
} from "../../../../generated/schema";
import { Pool } from "./pool";
import { Account } from "./account";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import * as constants from "../../util/constants";
import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";

/**
 * This file contains the Position class, which is used to
 * make all of the storage changes that occur in the position and
 * its corresponding snapshots.
 *
 * Schema Version:  1.2.0
 * SDK Version:     1.0.0
 * Author(s):
 *  - @harsh9200
 */

export class Position {
  protocol: Perpetual;
  tokens: TokenManager;
  position: PositionSchema | null;
  account: Account | null;
  pool: Pool | null;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
    this.pool = null;
    this.account = null;
    this.position = null;
  }

  private save(): void {
    this.position!.save();
  }

  private getPositionId(
    pool: Pool,
    account: Account,
    positionSide: constants.PositionSide
  ): Bytes {
    const positionId = account
      .getBytesId()
      .concat(Bytes.fromUTF8("-"))
      .concat(pool.getBytesID())
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromUTF8(positionSide));

    return getPositionIdWithCounter(positionId);
  }

  load(
    pool: Pool,
    account: Account,
    asset: Token,
    collateral: Token,
    positionSide: constants.PositionSide
  ): void {
    this.pool = pool;
    this.account = account;

    const positionId = this.getPositionId(pool, account, positionSide);

    this.position = PositionSchema.load(positionId);

    if (this.position) {
      this.takePositionSnapshot();
      return;
    }

    this.position = new PositionSchema(positionId);
    this.position.account = account.getBytesId();
    this.position.liquidityPool = pool.getBytesID();
    this.position.collateral = collateral.id;
    this.position.asset = asset.id;

    const event = this.protocol.getCurrentEvent();
    this.position.hashOpened = event.transaction.hash;
    this.position.blockNumberOpened = event.block.number;
    this.position.timestampOpened = event.block.timestamp;

    this.position.side = positionSide;
    this.position.fundingrateOpen = constants.BIGDECIMAL_ZERO;
    this.position.fundingrateClosed = constants.BIGDECIMAL_ZERO;
    this.position.leverage = constants.BIGDECIMAL_ZERO;

    this.position.balance = constants.BIGINT_ZERO;
    this.position.balanceUSD = constants.BIGDECIMAL_ZERO;

    this.position.collateralBalance = constants.BIGINT_ZERO;
    this.position.collateralBalanceUSD = constants.BIGDECIMAL_ZERO;

    this.position.collateralInCount = 0;
    this.position.collateralOutCount = 0;
    this.position.liquidationCount = 0;

    this.save();

    this.account.openPosition(this.position.side);
    this.pool.openPosition(this.position.side);
  }

  /**
   * Sets the position's fundingrateOpen value.
   * @param amount
   */
  setFundingrateOpen(amount: BigDecimal): void {
    if (!this.position) return;

    this.position.fundingrateOpen = amount;
    this.save();
  }

  /**
   * Sets the position's fundingrateClosed value.
   * @param amount
   */
  setFundingrateClosed(amount: BigDecimal): void {
    if (!this.position) return;

    this.position.fundingrateClosed = amount;
    this.save();
  }

  /**
   * Sets the position's leverage value.
   * @param amount
   */
  setLeverage(amount: BigDecimal): void {
    if (!this.position) return;

    this.position.leverage = amount;
    this.save();
  }

  /**
   * Sets the position's balance value.
   * @param token
   * @param amount
   */
  setBalance(token: Address, amount: BigInt): void {
    if (!this.position) return;

    this.position.balance = amount;
    this.position.balanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(this.tokens.getOrCreateToken(token), amount);
    this.save();
    this.takePositionSnapshot();
  }

  /**
   * Sets the position's collateralBalance value.
   * @param collateralToken
   * @param amount
   */
  setCollateralBalance(collateralToken: Address, amount: BigInt): void {
    if (!this.position) return;

    this.position.collateralBalance = amount;
    this.position.collateralBalanceUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(this.tokens.getOrCreateToken(collateralToken), amount);
    this.save();
    this.takePositionSnapshot();
  }

  /**
   * Adds 1 to the account position collateralIn count.
   */
  addCollateralIn(): void {
    if (!this.position) return;

    this.position.collateralInCount += 1;
    this.save();
  }

  /**
   * Adds 1 to the account position collateralOut count.
   */
  addCollateralOut(): void {
    if (!this.position) return;

    this.position.collateralOutCount += 1;
    this.save();
  }

  /**
   * Adds 1 to the account position liquidation count.
   */
  addLiquidation(): void {
    if (!this.position) return;

    this.position.liquidationCount += 1;
    this.save();
  }

  closePosition(): void {
    if (!this.position) return;

    const event = this.protocol.getCurrentEvent();
    this.position.hashClosed = event.transaction.hash;
    this.position.blockNumberClosed = event.block.number;
    this.position.timestampClosed = event.block.timestamp;
    this.save();

    if (this.account) this.account.closePosition(this.position.side);
    if (this.pool) this.pool.closePosition(this.position.side);

    this.takePositionSnapshot();
  }

  private takePositionSnapshot(): void {
    if (!this.position) return;

    const event = this.protocol.getCurrentEvent();
    const snapshotId = this.position!.id.concat(event.transaction.hash).concat(
      Bytes.fromBigInt(event.transaction.index)
    );
    const snapshot = new PositionSnapshot(snapshotId);

    snapshot.hash = event.transaction.hash;
    snapshot.logIndex = event.transaction.index.toI32();
    snapshot.nonce = event.transaction.nonce;

    snapshot.position = this.position!.id;
    snapshot.account = this.position!.account;
    snapshot.fundingrate = this.position!.fundingrateOpen;
    snapshot.balance = this.position!.balance;
    snapshot.collateralBalance = this.position!.collateralBalance;
    snapshot.balanceUSD = this.position!.balanceUSD;
    snapshot.collateralBalanceUSD = this.position!.collateralBalanceUSD;
    snapshot.blockNumber = this.protocol.event.block.number;
    snapshot.timestamp = this.protocol.event.block.timestamp;

    snapshot.save();
  }
}

function getPositionIdWithCounter(counterId: Bytes): Bytes {
  let positionCounter = _PositionCounter.load(counterId);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(counterId);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }

  return positionCounter.id
    .concat(Bytes.fromUTF8("-"))
    .concatI32(positionCounter.nextCount);
}

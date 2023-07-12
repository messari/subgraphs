import {
  log,
  Bytes,
  BigInt,
  Address,
  BigDecimal,
} from "@graphprotocol/graph-ts";

import { Pool } from "./pool";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import * as constants from "../../util/constants";
import { EventType, ActivityType, TransactionType } from "./enums";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

import {
  Swap,
  Borrow,
  Deposit,
  Withdraw,
  Liquidate,
  CollateralIn,
  CollateralOut,
  ActiveAccount,
  Account as AccountSchema,
} from "../../../../generated/schema";

/**
 * This file contains the AccountClass, which does
 * the operations on the Account entity. This includes:
 *  - Creating a new Account
 *  - Updating an existing Account
 *  - Making a position
 *  - Making position snapshots
 *
 * Schema Version:  1.3.1
 * SDK Version:     1.1.3
 * Author(s):
 *  - @harsh9200
 *  - @dhruv-chauhan
 */

class LoadAccountResponse {
  account: Account;
  isNewUser: boolean;

  constructor(account: Account, isNewUser: boolean) {
    this.account = account;
    this.isNewUser = isNewUser;
  }
}

export class AccountManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadAccount(address: Address): LoadAccountResponse {
    let isNewUser = false;
    let entity = AccountSchema.load(address);
    if (!entity) {
      isNewUser = true;
      entity = new AccountSchema(address);

      entity.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
      entity.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
      entity.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

      entity.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
      entity.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
      entity.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

      entity.longPositionCount = 0;
      entity.shortPositionCount = 0;
      entity.openPositionCount = 0;
      entity.closedPositionCount = 0;
      entity.cumulativeUniqueLiquidatees = 0;

      entity.depositCount = 0;
      entity.withdrawCount = 0;
      entity.borrowCount = 0;
      entity.swapCount = 0;
      entity.collateralInCount = 0;
      entity.collateralOutCount = 0;
      entity.liquidateCount = 0;
      entity.liquidationCount = 0;

      entity.save();
    }

    const account = new Account(this.protocol, entity, this.tokens);
    return new LoadAccountResponse(account, isNewUser);
  }
}

export class AccountWasActive {
  hourly: boolean;
  daily: boolean;
}

export class Account {
  account: AccountSchema;
  event: CustomEventType;
  protocol: Perpetual;
  tokens: TokenManager;
  pool: Pool | null;

  constructor(
    protocol: Perpetual,
    account: AccountSchema,
    tokens: TokenManager
  ) {
    this.pool = null;
    this.account = account;
    this.protocol = protocol;
    this.tokens = tokens;
    this.event = protocol.getCurrentEvent();
  }

  private getIdFromEvent(type: EventType): Bytes {
    return Bytes.fromUTF8(type.toLowerCase())
      .concat(Bytes.fromUTF8("-"))
      .concat(this.event.transaction.hash)
      .concat(Bytes.fromUTF8("-"))
      .concatI32(this.event.logIndex.toI32());
  }

  private getAmountUSD(tokens: Bytes[], amounts: BigInt[]): BigDecimal {
    let amountUSD = constants.BIGDECIMAL_ZERO;
    if (tokens.length != amounts.length) return amountUSD;

    for (let idx = 0; idx < tokens.length; idx++) {
      const token = this.tokens.getOrCreateToken(
        Address.fromBytes(tokens[idx])
      );

      amountUSD = amountUSD.plus(
        this.protocol.getTokenPricer().getAmountValueUSD(token, amounts[idx])
      );
    }
    return amountUSD;
  }

  private isActiveByActivityID(id: Bytes): boolean {
    let dAct = ActiveAccount.load(id);
    if (dAct) return false;

    dAct = new ActiveAccount(id);
    dAct.save();

    return true;
  }

  private trackActivity(activityType: ActivityType): void {
    const days = getUnixDays(this.event.block);
    const hours = getUnixHours(this.event.block);

    const generalHourlyID = `${this.account.id.toHexString()}-hourly-${hours}`;
    const generalDailyID = `${this.account.id.toHexString()}-daily-${days}`;

    const generalActivity: AccountWasActive = {
      daily: this.isActiveByActivityID(Bytes.fromUTF8(generalDailyID)),
      hourly: this.isActiveByActivityID(Bytes.fromUTF8(generalHourlyID)),
    };

    const typeHourlyID = `${this.account.id.toHexString()}-hourly-${hours}-${activityType}`;
    const typeDailyID = `${this.account.id.toHexString()}-daily-${days}-${activityType}`;

    const typeActivity: AccountWasActive = {
      daily: this.isActiveByActivityID(Bytes.fromUTF8(typeDailyID)),
      hourly: this.isActiveByActivityID(Bytes.fromUTF8(typeHourlyID)),
    };

    if (activityType == ActivityType.DEPOSIT) {
      this.protocol.addActiveDepositor(typeActivity);
    } else if (activityType == ActivityType.BORROW) {
      this.protocol.addActiveBorrower(typeActivity);
    } else if (activityType == ActivityType.LIQUIDATOR) {
      this.protocol.addActiveLiquidator(typeActivity);
    } else if (activityType == ActivityType.LIQUIDATEE) {
      this.protocol.addActiveLiquidatee(typeActivity);
    }

    this.protocol.addActiveUser(generalActivity);
  }

  getBytesId(): Bytes {
    return this.account.id;
  }

  /**
   *
   * @param pool The pool where the liquidity was deposited.
   * @param amounts The amount deposited of inputTokens.
   * @param sharesMinted The amount of shares minted of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the protocol and pool's deposit and transaction count.
   * @returns Deposit
   */
  deposit(
    pool: Pool,
    amounts: BigInt[],
    sharesMinted: BigInt,
    updateMetrics: bool = true
  ): Deposit {
    const depositId = this.getIdFromEvent(EventType.DEPOSIT);
    const deposit = new Deposit(depositId);

    if (amounts.length != pool.getInputTokens().length) {
      log.critical(
        "[Account][Deposit] Pool:{} inputTokens length does not match deposit amount array length",
        [pool.getBytesID().toHexString()]
      );
    }

    deposit.hash = this.event.transaction.hash;
    deposit.logIndex = this.event.logIndex.toI32();
    deposit.protocol = this.protocol.getBytesID();
    deposit.to = pool.getBytesID();
    deposit.from = this.account.id;
    deposit.account = this.account.id;
    deposit.blockNumber = this.event.block.number;
    deposit.timestamp = this.event.block.timestamp;
    deposit.inputTokens = pool.getInputTokens();
    deposit.outputToken = pool.getOutputToken();
    deposit.inputTokenAmounts = amounts;
    deposit.outputTokenAmount = sharesMinted;
    deposit.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    deposit.pool = pool.getBytesID();
    deposit.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countDeposit();
      this.protocol.addTransaction(TransactionType.DEPOSIT);
    }

    return deposit;
  }

  /**
   *
   * @param pool The pool where the liquidity was withdrawn.
   * @param amounts The amount withdrawn of inputTokens.
   * @param sharesBurnt The amount of shares burnt of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the protocol withdraw and transaction count.
   * @returns Withdraw
   */
  withdraw(
    pool: Pool,
    amounts: BigInt[],
    sharesBurnt: BigInt,
    updateMetrics: bool = true
  ): Withdraw {
    const withdrawId = this.getIdFromEvent(EventType.WITHDRAW);
    const withdraw = new Withdraw(withdrawId);

    if (amounts.length != pool.getInputTokens().length) {
      log.critical(
        "[Account][Withdraw] Pool:{} inputTokens length does not match Withdraw amount array length",
        [pool.getBytesID().toHexString()]
      );
    }

    withdraw.hash = this.event.transaction.hash;
    withdraw.logIndex = this.event.logIndex.toI32();
    withdraw.protocol = this.protocol.getBytesID();
    withdraw.to = this.account.id;
    withdraw.from = pool.getBytesID();
    withdraw.account = this.account.id;
    withdraw.blockNumber = this.event.block.number;
    withdraw.timestamp = this.event.block.timestamp;
    withdraw.inputTokens = pool.getInputTokens();
    withdraw.outputToken = pool.getOutputToken();
    withdraw.inputTokenAmounts = amounts;
    withdraw.outputTokenAmount = sharesBurnt;
    withdraw.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    withdraw.pool = pool.getBytesID();
    withdraw.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countWithdraw();
      this.protocol.addTransaction(TransactionType.WITHDRAW);
    }
    return withdraw;
  }

  /**
   *
   * @param pool The pool where the liquidity was swapped.
   * @param tokenIn The token deposited into the pool.
   * @param amountIn The token amount deposited into the pool.
   * @param tokenIn The token withdrawn from the pool.
   * @param amountIn The token amount withdrawn from the pool.
   * @param tradingPair  The contract address for the trading pair or pool.
   * @param updateMetrics Optional, defaults to true. If true it will update the protocol swap and transaction count.
   * @returns Swap
   */
  swap(
    pool: Pool,
    tokenIn: Address,
    amountIn: BigInt,
    tokenOut: Address,
    amountOut: BigInt,
    tradingPair: Address,
    updateMetrics: bool = true
  ): Swap {
    const swapId = this.getIdFromEvent(EventType.SWAP);
    const swap = new Swap(swapId);

    swap.hash = this.event.transaction.hash;
    swap.logIndex = this.event.logIndex.toI32();
    swap.protocol = this.protocol.getBytesID();
    swap.to = pool.getBytesID();
    swap.from = this.account.id;
    swap.account = this.account.id;
    swap.blockNumber = this.event.block.number;
    swap.timestamp = this.event.block.timestamp;

    swap.tokenIn = tokenIn;
    swap.amountIn = amountIn;
    swap.amountInUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(this.tokens.getOrCreateToken(tokenIn), amountIn);

    swap.tokenOut = tokenOut;
    swap.amountOut = amountOut;
    swap.amountOutUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(this.tokens.getOrCreateToken(tokenOut), amountOut);

    swap.tradingPair = tradingPair;
    swap.pool = pool.getBytesID();
    swap.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countSwap();
      this.protocol.addTransaction(TransactionType.SWAP);
    }
    return swap;
  }

  /**
   *
   * @param pool The pool where the liquidity was swapped.
   * @param tokenIn The token deposited into the pool.
   * @param amountIn The token amount deposited into the pool.
   * @param tokenIn The token withdrawn from the pool.
   * @param amountIn The token amount withdrawn from the pool.
   * @param tradingPair  The contract address for the trading pair or pool.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns Borrow
   */
  borrow(
    pool: Pool,
    position: Bytes,
    asset: Address,
    amount: BigInt,
    updateMetrics: bool = true
  ): Borrow {
    const borrowId = this.getIdFromEvent(EventType.SWAP);
    const borrow = new Borrow(borrowId);

    borrow.hash = this.event.transaction.hash;
    borrow.logIndex = this.event.logIndex.toI32();
    borrow.protocol = this.protocol.getBytesID();
    borrow.position = position;
    borrow.to = pool.getBytesID();
    borrow.from = this.account.id;
    borrow.blockNumber = this.event.block.number;
    borrow.timestamp = this.event.block.timestamp;
    borrow.account = this.account.id;

    borrow.asset = asset;
    borrow.amount = amount;
    borrow.amountUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(this.tokens.getOrCreateToken(asset), amount);
    borrow.pool = pool.getBytesID();
    borrow.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countBorrow();
      this.protocol.addTransaction(TransactionType.BORROW);
    }
    return borrow;
  }

  /**
   *
   * @param pool The pool where the collateral was deposited.
   * @param position
   * @param amounts The amount deposited of inputTokens.
   * @param sharesMinted The amount of shares minted of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns CollateralIn
   */
  collateralIn(
    pool: Pool,
    position: Bytes,
    amounts: BigInt[],
    sharesMinted: BigInt,
    updateMetrics: bool = true
  ): CollateralIn {
    const collateralId = this.getIdFromEvent(EventType.DEPOSIT);
    const collateralIn = new CollateralIn(collateralId);

    if (amounts.length != pool.getInputTokens().length) {
      log.critical(
        "[Account][collateralIn] Pool:{} inputTokens length does not match collateralIn amount array length",
        [pool.getBytesID().toHexString()]
      );
    }

    collateralIn.hash = this.event.transaction.hash;
    collateralIn.logIndex = this.event.logIndex.toI32();
    collateralIn.protocol = this.protocol.getBytesID();
    collateralIn.position = position;
    collateralIn.to = pool.getBytesID();
    collateralIn.from = this.account.id;
    collateralIn.account = this.account.id;
    collateralIn.blockNumber = this.event.block.number;
    collateralIn.timestamp = this.event.block.timestamp;
    collateralIn.inputTokens = pool.getInputTokens();
    collateralIn.outputToken = pool.getOutputToken();
    collateralIn.inputTokenAmounts = amounts;
    collateralIn.outputTokenAmount = sharesMinted;
    collateralIn.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    collateralIn.pool = pool.getBytesID();
    collateralIn.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countCollateralIn();
      this.protocol.addTransaction(TransactionType.COLLATERAL_IN);
    }
    return collateralIn;
  }

  /**
   *
   * @param pool The pool where the collateral was withdrawn.
   * @param position The position this transaction belongs to as relates to Long or Short but not LP.
   * @param amounts The amount withdrawn of inputTokens.
   * @param sharesMinted The amount of shares burnt of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns CollateralOut
   */
  collateralOut(
    pool: Pool,
    position: Bytes,
    amounts: BigInt[],
    sharesBurnt: BigInt,
    updateMetrics: bool = true
  ): CollateralOut {
    const collateralId = this.getIdFromEvent(EventType.WITHDRAW);
    const collateralOut = new CollateralOut(collateralId);

    if (amounts.length != pool.getInputTokens().length) {
      log.critical(
        "[Account][collateralOut] Pool:{} inputTokens length does not match collateralOut amount array length",
        [pool.getBytesID().toHexString()]
      );
    }

    collateralOut.hash = this.event.transaction.hash;
    collateralOut.logIndex = this.event.logIndex.toI32();
    collateralOut.protocol = this.protocol.getBytesID();
    collateralOut.position = position;
    collateralOut.to = this.account.id;
    collateralOut.from = pool.getBytesID();
    collateralOut.account = this.account.id;
    collateralOut.blockNumber = this.event.block.number;
    collateralOut.timestamp = this.event.block.timestamp;
    collateralOut.inputTokens = pool.getInputTokens();
    collateralOut.outputToken = pool.getOutputToken();
    collateralOut.inputTokenAmounts = amounts;
    collateralOut.outputTokenAmount = sharesBurnt;
    collateralOut.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    collateralOut.pool = pool.getBytesID();
    collateralOut.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countCollateralOut();
      this.protocol.addTransaction(TransactionType.COLLATERAL_OUT);
    }
    return collateralOut;
  }

  /**
   *
   * @param pool The pool where the liquidation happened.
   * @param asset Asset repaid (borrowed)
   * @param collateralToken Token which was the collateral
   * @param amountLiquidated Amount of collateral liquidated in native units
   * @param liquidator Account that carried out the liquidation
   * @param liquidatee Account that got liquidated
   * @param position The position this Liquidate belongs to
   * @param profitUSD Amount of profit from liquidation in USD
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns Liquidate
   */
  liquidate(
    pool: Pool,
    asset: Address,
    collateralToken: Address,
    amountLiquidated: BigInt,
    liquidator: Address,
    liquidatee: Address,
    position: Bytes,
    profitUSD: BigDecimal,
    updateMetrics: bool = true
  ): Liquidate {
    const liquidateId = this.getIdFromEvent(EventType.LIQUIDATE);
    const liquidate = new Liquidate(liquidateId);

    liquidate.hash = this.event.transaction.hash;
    liquidate.logIndex = this.event.logIndex.toI32();
    liquidate.protocol = this.protocol.getBytesID();
    liquidate.position = position;
    liquidate.to = liquidator;
    liquidate.from = liquidatee;
    liquidate.blockNumber = this.event.block.number;
    liquidate.timestamp = this.event.block.timestamp;
    liquidate.account = liquidator;
    liquidate.liquidatee = liquidatee;
    liquidate.asset = asset;
    liquidate.amount = amountLiquidated;
    liquidate.amountUSD = this.protocol
      .getTokenPricer()
      .getAmountValueUSD(
        this.tokens.getOrCreateToken(collateralToken),
        amountLiquidated
      );
    liquidate.profitUSD = profitUSD;
    liquidate.pool = pool.getBytesID();
    liquidate.save();

    if (updateMetrics) {
      this.pool = pool;
      this.countLiquidatee();
      this.countLiquidator(liquidator);
      this.protocol.addTransaction(TransactionType.LIQUIDATE);
    }
    return liquidate;
  }

  /**
   * Adds 1 to the account total deposit count. If it is the first deposit ever
   * and the account has not withdrawn before it will also increase
   * the number of unique depositors in the protocol and pool.
   */
  countDeposit(): void {
    if (this.account.depositCount == 0) {
      this.protocol.addDepositor();
      if (this.pool) this.pool!.addDepositor();
    }

    this.account.depositCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.DEPOSIT);
  }

  /**
   * Adds 1 to the account total withdraw count.
   */
  countWithdraw(): void {
    this.account.withdrawCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total borrow count. If it is the first borrow ever
   * and the account has not borrowed before it will also increase
   * the number of unique borrowers in the protocol and pool.
   */
  countBorrow(): void {
    if (this.account.borrowCount == 0) {
      this.protocol.addBorrower();
      if (this.pool) this.pool!.addBorrower();
    }

    this.account.borrowCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.BORROW);
  }

  /**
   * Adds 1 to the account total swap count.
   */
  countSwap(): void {
    this.account.swapCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total collateralIn count.
   */
  countCollateralIn(): void {
    this.account.collateralInCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total collateralOut count.
   */
  countCollateralOut(): void {
    this.account.collateralOutCount += 1;
    this.account.save();
  }

  /**
   * Adds 1 to the account total liquidation count. If it is the first liquidation ever
   * it will also increase the number of unique liquidation in the protocol and the associated pool.
   */
  countLiquidator(liquidator: Address): void {
    let entity = AccountSchema.load(liquidator);
    if (!entity) {
      const accountManager = new AccountManager(this.protocol, this.tokens);
      accountManager.loadAccount(liquidator);

      entity = AccountSchema.load(liquidator);
    }

    if (entity!.liquidateCount == 0) {
      this.protocol.addLiquidator();
      if (this.pool) this.pool!.addLiquidator();
    }

    entity!.liquidateCount += 1;
    entity!.save();

    this.trackActivity(ActivityType.LIQUIDATOR);
  }

  /**
   * Adds 1 to the account total liquidatee count. If it is the first liquidatee ever
   * it will also increase the number of unique liquidatee in the protocol and the associated pool.
   */
  countLiquidatee(): void {
    if (this.account.liquidationCount == 0) {
      this.protocol.addLiquidatee();
      if (this.pool) this.pool!.addLiquidatee();
    }

    this.account.liquidationCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.LIQUIDATEE);
  }

  openPosition(positionSide: constants.PositionSide): void {
    if (positionSide == constants.PositionSide.LONG) {
      this.account.longPositionCount += 1;
    } else {
      this.account.shortPositionCount += 1;
    }
    this.account.openPositionCount += 1;
    this.account.save();
  }

  closePosition(
    positionSide: constants.PositionSide,
    isExistingOpenPosition: boolean = true
  ): void {
    if (isExistingOpenPosition) {
      if (positionSide == constants.PositionSide.LONG) {
        this.account.longPositionCount -= 1;
      } else {
        this.account.shortPositionCount -= 1;
      }
      this.account.openPositionCount -= 1;
    }
    this.account.closedPositionCount += 1;

    this.account.save();
  }
}

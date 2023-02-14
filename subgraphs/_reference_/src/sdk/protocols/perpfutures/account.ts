import {
  Swap,
  Deposit,
  Withdraw,
  Liquidate,
  CollateralIn,
  CollateralOut,
  ActiveAccount,
  Account as AccountSchema,
} from "../../../../generated/schema";
import { Pool } from "./pool";
import { Perpetual } from "./protocol";
import { TokenManager } from "./tokens";
import { EventType, ActivityType } from "./enums";
import * as constants from "../../util/constants";
import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { CustomEventType, getUnixDays, getUnixHours } from "../../util/events";

export class AccountManager {
  protocol: Perpetual;
  tokens: TokenManager;

  constructor(protocol: Perpetual, tokens: TokenManager) {
    this.protocol = protocol;
    this.tokens = tokens;
  }

  loadAccount(address: Address): Account {
    let account = AccountSchema.load(address);
    if (!account) {
      account = new AccountSchema(address);

      account.cumulativeEntryPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeExitPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeTotalPremiumUSD = constants.BIGDECIMAL_ZERO;

      account.cumulativeDepositPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeWithdrawPremiumUSD = constants.BIGDECIMAL_ZERO;
      account.cumulativeTotalLiquidityPremiumUSD = constants.BIGDECIMAL_ZERO;

      account.longPositionCount = 0;
      account.shortPositionCount = 0;
      account.openPositionCount = 0;
      account.closedPositionCount = 0;
      account.cumulativeUniqueLiquidatees = 0;

      account.save();

      this.protocol.addUser();
    }
    return new Account(this.protocol, account, this.tokens);
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

  constructor(
    protocol: Perpetual,
    account: AccountSchema,
    tokens: TokenManager
  ) {
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

  /**
   *
   * @param pool The pool where the liquidity was deposited.
   * @param amounts The amount deposited of inputTokens.
   * @param sharesMinted The amount of shares minted of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns Deposit
   */
  deposit(
    pool: Pool,
    amounts: BigInt[],
    sharesMinted: BigInt,
    updateMetrics: bool = true
  ): Deposit {
    const depositId = this.getIdFromEvent(EventType.DEPOSIT);
    let deposit = new Deposit(depositId);

    deposit.hash = this.event.transaction.hash.toHexString();
    deposit.logIndex = this.event.logIndex.toI32();
    deposit.protocol = this.protocol.getBytesID();
    deposit.to = pool.getBytesID().toHexString();
    deposit.from = this.account.id.toHexString();
    deposit.account = this.account.id;
    deposit.blockNumber = this.event.block.number;
    deposit.timestamp = this.event.block.timestamp;
    deposit.inputTokens = pool.getInputTokens();
    deposit.outputToken = pool.getOutputToken();
    deposit.inputTokenAmounts = amounts;
    deposit.outputTokenAmount = sharesMinted;
    deposit.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    deposit.pool = pool.getBytesID();

    if (updateMetrics) pool.addDepositor();

    return deposit;
  }

  /**
   *
   * @param pool The pool where the liquidity was withdrawn.
   * @param amounts The amount withdrawn of inputTokens.
   * @param sharesMinted The amount of shares burnt of outputToken.
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
   * @returns Withdraw
   */
  withdraw(
    pool: Pool,
    amounts: BigInt[],
    sharesBurnt: BigInt,
    updateMetrics: bool = true
  ): Withdraw {
    const withdrawId = this.getIdFromEvent(EventType.WITHDRAW);
    let withdraw = new Withdraw(withdrawId);

    withdraw.hash = this.event.transaction.hash.toHexString();
    withdraw.logIndex = this.event.logIndex.toI32();
    withdraw.protocol = this.protocol.getBytesID();
    withdraw.to = this.account.id.toHexString();
    withdraw.from = pool.getBytesID().toHexString();
    withdraw.account = this.account.id;
    withdraw.blockNumber = this.event.block.number;
    withdraw.timestamp = this.event.block.timestamp;
    withdraw.inputTokens = pool.getInputTokens();
    withdraw.outputToken = pool.getOutputToken();
    withdraw.inputTokenAmounts = amounts;
    withdraw.outputTokenAmount = sharesBurnt;
    withdraw.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    withdraw.pool = pool.getBytesID();

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
   * @param updateMetrics Optional, defaults to true. If true it will update the pool and protocol TVL and inputTokenBalance.
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
    let swap = new Swap(swapId);

    swap.hash = this.event.transaction.hash.toHexString();
    swap.logIndex = this.event.logIndex.toI32();
    swap.protocol = this.protocol.getBytesID();
    swap.to = pool.getBytesID().toHexString();
    swap.from = this.account.id.toHexString();
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

    return swap;
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
    let collateralIn = new CollateralIn(collateralId);

    collateralIn.hash = this.event.transaction.hash.toHexString();
    collateralIn.logIndex = this.event.logIndex.toI32();
    collateralIn.protocol = this.protocol.getBytesID();
    collateralIn.position = position;
    collateralIn.to = pool.getBytesID().toHexString();
    collateralIn.from = this.account.id.toHexString();
    collateralIn.account = this.account.id;
    collateralIn.blockNumber = this.event.block.number;
    collateralIn.timestamp = this.event.block.timestamp;
    collateralIn.inputTokens = pool.getInputTokens();
    collateralIn.outputToken = pool.getOutputToken();
    collateralIn.inputTokenAmounts = amounts;
    collateralIn.outputTokenAmount = sharesMinted;
    collateralIn.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    collateralIn.pool = pool.getBytesID();

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
    let collateralOut = new CollateralOut(collateralId);

    collateralOut.hash = this.event.transaction.hash.toHexString();
    collateralOut.logIndex = this.event.logIndex.toI32();
    collateralOut.protocol = this.protocol.getBytesID();
    collateralOut.position = position;
    collateralOut.to = this.account.id.toHexString();
    collateralOut.from = pool.getBytesID().toHexString();
    collateralOut.account = this.account.id;
    collateralOut.blockNumber = this.event.block.number;
    collateralOut.timestamp = this.event.block.timestamp;
    collateralOut.inputTokens = pool.getInputTokens();
    collateralOut.outputToken = pool.getOutputToken();
    collateralOut.inputTokenAmounts = amounts;
    collateralOut.outputTokenAmount = sharesBurnt;
    collateralOut.amountUSD = this.getAmountUSD(pool.getInputTokens(), amounts);
    collateralOut.pool = pool.getBytesID();

    return collateralOut;
  }

  /**
   *
   * @param pool
   * @param asset
   * @param collateralToken
   * @param amountLiquidated
   * @param liquidator
   * @param liquidatee
   * @param position
   * @param profitUSD
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
    let liquidate = new Liquidate(liquidateId);

    liquidate.hash = this.event.transaction.hash.toHexString();
    liquidate.logIndex = this.event.logIndex.toI32();
    liquidate.protocol = this.protocol.getBytesID();
    liquidate.position = position;
    liquidate.to = liquidator.toHexString();
    liquidate.from = liquidatee.toHexString();
    liquidate.blockNumber = this.event.block.number;
    liquidate.timestamp = this.event.block.timestamp;
    liquidate.liquidator = liquidator;
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

    return liquidate;
  }

  /**
   * Adds 1 to the account total deposit count. If it is the first deposit ever
   * and the account has not withdrawn before it will also increase
   * the number of unique depositors in the protocol.
   */
  countDeposit(): void {
    if (this.account._depositCount == 0) this.protocol.addDepositor();

    this.account._depositCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.DEPOSIT);
  }

  /**
   * Adds 1 to the account total borrow count. If it is the first borrow ever
   * and the account has not withdrawn before it will also increase
   * the number of unique borrowers in the protocol.
   */
  countBorrow(): void {
    if (this.account._borrowCount == 0) this.protocol.addBorrower();

    this.account._borrowCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.BORROW);
  }

  /**
   * Adds 1 to the account total liquidation count. If it is the first liquidation ever
   * and the account has not withdrawn before it will also increase
   * the number of unique liquidation in the protocol.
   */
  countLiquidator(): void {
    if (this.account._liquidationCount == 0) this.protocol.addLiquidator();

    this.account._liquidationCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.LIQUIDATOR);
  }

  /**
   * Adds 1 to the account total liquidatee count. If it is the first liquidatee ever
   * and the account has not withdrawn before it will also increase
   * the number of unique liquidatee in the protocol.
   */
  countLiquidatee(): void {
    if (this.account._liquidateCount == 0) this.protocol.addLiquidatee();

    this.account._liquidateCount += 1;
    this.account.save();

    this.trackActivity(ActivityType.LIQUIDATEE);
  }
}

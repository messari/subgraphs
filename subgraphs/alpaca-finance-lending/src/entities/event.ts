import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Repay,
  Withdraw,
} from "../../generated/schema";
import {
  getOrCreateAccount,
  incrementAccountBorrowCount,
  incrementAccountDepositCount,
  incrementAccountLiquidationCount,
  incrementAccountLiquidatorCount,
  incrementAccountRepayCount,
  incrementAccountWithdrawCount,
} from "./account";
import {
  addMarketProtocolSideRevenue,
  addMarketSupplySideRevenue,
  addMarketVolume,
} from "./market";
import {
  checkIfPositionClosed,
  getOrCreateUserPosition,
  incrementPositionBorrowCount,
  incrementPositionDepositCount,
  incrementPositionLiquidationCount,
  incrementPositionRepayCount,
  incrementPositionWithdrawCount,
} from "./position";
import { amountInUSD } from "./price";
import { getOrCreateToken } from "./token";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "./usage";
import { BIGINT_ZERO, PositionSide } from "../utils/constants";

export enum EventType {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
  Liquidated,
}

export function createDeposit(
  event: ethereum.Event,
  market: Market,
  reserve: Address,
  user: Address,
  amount: BigInt,
  isTransfer: boolean = false
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid deposit amount: {}", [amount.toString()]);
    return;
  }
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  const asset = getOrCreateToken(reserve);
  const deposit = new Deposit(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = account.id;
  deposit.market = market.id;
  deposit.position = position.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.amountUSD = amountInUSD(amount, asset, event.block.number);
  deposit.save();
  updateUsageMetrics(event, event.transaction.from);
  if (!isTransfer) {
    addMarketVolume(event, market, deposit.amountUSD, EventType.Deposit);
    incrementProtocolDepositCount(event, account);
  }
  incrementAccountDepositCount(account);
  incrementPositionDepositCount(position);
}

export function createWithdraw(
  event: ethereum.Event,
  market: Market,
  reserve: Address,
  user: Address,
  amount: BigInt,
  isTransfer: boolean = false
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid withdraw amount: {}", [amount.toString()]);
    return;
  }
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  const asset = getOrCreateToken(reserve);
  const withdraw = new Withdraw(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account.id;
  withdraw.market = market.id;
  withdraw.position = position.id;
  withdraw.asset = asset.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountInUSD(amount, asset, event.block.number);
  withdraw.save();
  updateUsageMetrics(event, user);
  if (!isTransfer) {
    addMarketVolume(event, market, withdraw.amountUSD, EventType.Withdraw);
    incrementProtocolWithdrawCount(event);
  }
  incrementAccountWithdrawCount(account);
  incrementPositionWithdrawCount(position);
}

export function createBorrow(
  event: ethereum.Event,
  market: Market,
  reserve: Address,
  borrower: Address,
  amount: BigInt
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid borrow amount: {}", [amount.toString()]);
    return;
  }
  const account = getOrCreateAccount(borrower);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  const asset = getOrCreateToken(reserve);
  const borrow = new Borrow(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.nonce = event.transaction.nonce;
  borrow.logIndex = event.logIndex.toI32();
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account.id;
  borrow.market = market.id;
  borrow.position = position.id;
  borrow.asset = asset.id;
  borrow.amount = amount;
  borrow.amountUSD = amountInUSD(amount, asset, event.block.number);
  borrow.save();
  updateUsageMetrics(event, borrower);
  addMarketVolume(event, market, borrow.amountUSD, EventType.Borrow);
  incrementProtocolBorrowCount(event, account);
  incrementAccountBorrowCount(account);
  incrementPositionBorrowCount(position);
}

export function createRepay(
  event: ethereum.Event,
  market: Market,
  reserve: Address,
  user: Address,
  amount: BigInt
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid repay amount: {}", [amount.toString()]);
    return;
  }
  const asset = getOrCreateToken(reserve);
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  const repay = new Repay(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account.id;
  repay.market = market.id;
  repay.position = position.id;
  repay.asset = asset.id;
  repay.amount = amount;
  repay.amountUSD = amountInUSD(amount, asset, event.block.number);
  repay.save();
  updateUsageMetrics(event, user);
  addMarketVolume(event, market, repay.amountUSD, EventType.Repay);
  incrementProtocolRepayCount(event);
  incrementAccountRepayCount(account);
  incrementPositionRepayCount(position);
}

export function createLiquidate(
  event: ethereum.Event,
  market: Market,
  collateralAsset: Address,
  amountLiquidated: BigInt,
  debtAsset: Address,
  profitAmount: BigInt,
  protocolSideProfitAmount: BigInt,
  liquidator: Address,
  liquidatee: Address
): void {
  const debtToken = getOrCreateToken(debtAsset);
  const collateralToken = getOrCreateToken(collateralAsset);
  const userAccount = getOrCreateAccount(liquidatee);
  const liquidatorAccount = getOrCreateAccount(liquidator);
  const lenderPosition = getOrCreateUserPosition(
    event,
    userAccount,
    market,
    PositionSide.LENDER
  );
  const borrowerPosition = getOrCreateUserPosition(
    event,
    userAccount,
    market,
    PositionSide.BORROWER
  );
  const liquidate = new Liquidate(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidatorAccount.id;
  liquidate.liquidatee = userAccount.id;
  liquidate.market = market.id;
  liquidate.position = borrowerPosition.id;
  liquidate.lenderPosition = lenderPosition.id;
  liquidate.asset = debtToken.id;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountInUSD(
    amountLiquidated,
    collateralToken,
    event.block.number
  );
  liquidate.profitUSD = amountInUSD(
    profitAmount,
    debtToken,
    event.block.number
  );
  liquidate.save();
  updateUsageMetrics(event, liquidator);

  const protocolSideProfitUSD = amountInUSD(
    protocolSideProfitAmount,
    debtToken,
    event.block.number
  );
  addMarketProtocolSideRevenue(event, market, protocolSideProfitUSD);
  addMarketSupplySideRevenue(
    event,
    market,
    liquidate.profitUSD.minus(protocolSideProfitUSD)
  );
  addMarketVolume(event, market, liquidate.amountUSD, EventType.Liquidate);
  incrementProtocolLiquidateCount(event, userAccount, liquidatorAccount);
  incrementAccountLiquidationCount(userAccount);
  incrementPositionLiquidationCount(borrowerPosition);
  incrementPositionLiquidationCount(lenderPosition);
  incrementAccountLiquidatorCount(liquidatorAccount);
  checkIfPositionClosed(event, userAccount, market, lenderPosition);
  checkIfPositionClosed(event, userAccount, market, borrowerPosition);
}

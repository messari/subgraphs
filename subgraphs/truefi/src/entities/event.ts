import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Repay,
  Withdraw,
} from "../../generated/schema";
import { BIGINT_ZERO } from "../utils/constants";
import { PositionSide } from "../utils/constants";
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
  addMarketBorrowVolume,
  addMarketDepositVolume,
  addMarketLiquidateVolume,
  addMarketRepayVolume,
  addMarketSupplySideRevenue,
  addMarketWithdrawVolume,
  getMarket,
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
import { amountInUSD, amountInUSDForTru } from "./price";
import { getOrCreateToken } from "./token";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "./usage";

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
  reserve: Address,
  user: Address,
  amount: BigInt,
  isTransfer: boolean = false
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid deposit amount: {}", [amount.toString()]);
    return;
  }
  const market = getMarket(event.address);
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
  deposit.amountUSD = amountInUSD(amount, asset);
  deposit.save();
  updateUsageMetrics(event, event.transaction.from);
  if (!isTransfer) {
    addMarketDepositVolume(event, market, deposit.amountUSD);
    incrementProtocolDepositCount(event, account);
  }
  incrementAccountDepositCount(account);
  incrementPositionDepositCount(position);
}

export function createWithdraw(
  event: ethereum.Event,
  reserve: Address,
  user: Address,
  amount: BigInt,
  isTransfer: boolean = false
): void {
  if (amount.le(BIGINT_ZERO)) {
    log.warning("Invalid withdraw amount: {}", [amount.toString()]);
    return;
  }
  const market = getMarket(event.address);
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
  withdraw.amountUSD = amountInUSD(amount, asset);
  withdraw.save();
  updateUsageMetrics(event, user);
  if (!isTransfer) {
    addMarketWithdrawVolume(event, market, withdraw.amountUSD);
    incrementProtocolWithdrawCount(event);
  }
  incrementAccountWithdrawCount(account);
  incrementPositionWithdrawCount(position);
  checkIfPositionClosed(event, account, market, position);
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
  borrow.amountUSD = amountInUSD(amount, asset);
  borrow.save();
  updateUsageMetrics(event, borrower);
  addMarketBorrowVolume(event, market, borrow.amountUSD);
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
  repay.amountUSD = amountInUSD(amount, asset);
  repay.save();
  updateUsageMetrics(event, user);
  addMarketRepayVolume(event, market, repay.amountUSD);
  incrementProtocolRepayCount(event);
  incrementAccountRepayCount(account);
  incrementPositionRepayCount(position);
  checkIfPositionClosed(event, account, market, position);
}

export function createLiquidate(
  event: ethereum.Event,
  collateralAsset: Address,
  amountLiquidated: BigInt,
  debtAsset: Address,
  debtAmount: BigInt,
  liquidator: Address,
  liquidatee: Address
): void {
  const market = getMarket(collateralAsset);
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
    getMarket(debtAsset),
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
  liquidate.amountUSD = amountInUSDForTru(amountLiquidated, collateralToken);
  liquidate.profitUSD = liquidate.amountUSD.minus(
    amountInUSD(debtAmount, debtToken)
  );
  liquidate.amountUSD = amountInUSDForTru(amountLiquidated, collateralToken);
  liquidate.profitUSD = liquidate.amountUSD.minus(
    amountInUSD(debtAmount, debtToken)
  );
  liquidate.save();
  updateUsageMetrics(event, liquidator);
  addMarketSupplySideRevenue(event, market, liquidate.profitUSD);
  addMarketLiquidateVolume(event, market, liquidate.amountUSD);
  incrementProtocolLiquidateCount(event, userAccount, liquidatorAccount);
  incrementAccountLiquidationCount(userAccount);
  incrementPositionLiquidationCount(borrowerPosition);
  incrementPositionLiquidationCount(lenderPosition);
  incrementAccountLiquidatorCount(liquidatorAccount);
  checkIfPositionClosed(event, userAccount, market, lenderPosition);
  checkIfPositionClosed(event, userAccount, market, borrowerPosition);
}

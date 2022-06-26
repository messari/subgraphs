import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Repay,
  Withdraw,
} from "../../../../generated/schema";
import { BIGINT_ZERO } from "../../../../src/utils/constants";
import {
  addMarketBorrowVolume,
  addMarketDepositVolume,
  addMarketLiquidateVolume,
  addMarketRepayVolume,
  addMarketSupplySideRevenue,
  addMarketWithdrawVolume,
  getMarket,
} from "./market";
import { amountInUSD } from "./price";
import { getOrCreateLendingProtocol } from "./protocol";
import { getOrCreateToken } from "./token";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "./usage";

export function createDeposit(
  event: ethereum.Event,
  reserve: Address,
  user: Address,
  amount: BigInt
): Deposit {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amount.toString()]);
  }
  const market = getMarket(reserve);
  const asset = getOrCreateToken(reserve);
  const deposit = new Deposit(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateLendingProtocol().id;
  deposit.to = market.id;
  deposit.from = user.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = market.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.amountUSD = amountInUSD(amount, asset);
  deposit.save();
  updateUsageMetrics(event, event.transaction.from);
  addMarketDepositVolume(event, market, deposit.amountUSD);
  incrementProtocolDepositCount(event);
  return deposit;
}

export function createWithdraw(
  event: ethereum.Event,
  reserve: Address,
  to: Address,
  amount: BigInt
): Withdraw {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amount.toString()]);
  }
  const market = getMarket(reserve);
  const asset = getOrCreateToken(reserve);
  const withdraw = new Withdraw(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateLendingProtocol().id;
  withdraw.from = market.id;
  withdraw.to = to.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = market.id;
  withdraw.asset = asset.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountInUSD(amount, asset);
  withdraw.save();
  updateUsageMetrics(event, to);
  addMarketWithdrawVolume(event, market, withdraw.amountUSD);
  incrementProtocolWithdrawCount(event);
  return withdraw;
}

export function createBorrow(
  event: ethereum.Event,
  reserve: Address,
  borrower: Address,
  amount: BigInt
): Borrow {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amount.toString()]);
  }
  const market = getMarket(reserve);
  const asset = getOrCreateToken(reserve);
  const borrow = new Borrow(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = getOrCreateLendingProtocol().id;
  borrow.from = market.id;
  borrow.to = borrower.toHexString();
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = market.id;
  borrow.asset = asset.id;
  borrow.amount = amount;
  borrow.amountUSD = amountInUSD(amount, asset);
  borrow.save();
  updateUsageMetrics(event, borrower);
  addMarketBorrowVolume(event, market, borrow.amountUSD);
  incrementProtocolBorrowCount(event);
  return borrow;
}

export function createRepay(
  event: ethereum.Event,
  reserve: Address,
  repayer: Address,
  amount: BigInt
): Repay {
  if (amount.le(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amount.toString()]);
  }
  const market = getMarket(reserve);
  const asset = getOrCreateToken(reserve);
  const repay = new Repay(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = getOrCreateLendingProtocol().id;
  repay.to = market.id;
  repay.from = repayer.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = market.id;
  repay.asset = asset.id;
  repay.amount = amount;
  repay.amountUSD = amountInUSD(amount, asset);
  repay.save();
  updateUsageMetrics(event, repayer);
  addMarketRepayVolume(event, market, repay.amountUSD);
  incrementProtocolRepayCount(event);
  return repay;
}

export function createLiquidate(
  event: ethereum.Event,
  collateralAsset: Address,
  amountLiquidated: BigInt,
  debtAsset: Address,
  debtAmount: BigInt,
  liquidator: Address,
  liquidatee: Address
): Liquidate {
  const market = getMarket(collateralAsset);
  const debtToken = getOrCreateToken(debtAsset);
  const collateralToken = getOrCreateToken(collateralAsset);
  const liquidate = new Liquidate(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = getOrCreateLendingProtocol().id;
  liquidate.to = market.id;
  liquidate.from = liquidator.toHexString();
  liquidate.liquidatee = liquidatee.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = market.id;
  liquidate.asset = debtToken.id;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountInUSD(amountLiquidated, collateralToken);
  liquidate.profitUSD = liquidate.amountUSD.minus(
    amountInUSD(debtAmount, debtToken)
  );
  liquidate.save();
  updateUsageMetrics(event, liquidator);
  addMarketSupplySideRevenue(event, market, liquidate.profitUSD);
  addMarketLiquidateVolume(event, market, liquidate.amountUSD);
  incrementProtocolLiquidateCount(event);
  return liquidate;
}

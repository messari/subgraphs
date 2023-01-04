import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Repay,
  Withdraw,
} from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import {
  handleMarketBorrow,
  handleMarketDeposit,
  getMarket,
  handleMarketWithdraw,
  handleMarketRepay,
  handleMarketLiquidate,
  handleMarketClosingFee,
  updateMarketBorrowBalance,
} from "./market";
import { getCollateralPrice } from "./price";
import { addSupplySideRevenue, getOrCreateLendingProtocol } from "./protocol";
import { getMaiToken, getOrCreateToken } from "./token";
import {
  incrementProtocolBorrowCount,
  incrementProtocolDepositCount,
  incrementProtocolLiquidateCount,
  incrementProtocolRepayCount,
  incrementProtocolWithdrawCount,
  updateUsageMetrics,
} from "./usage";

export function createDeposit(event: ethereum.Event, amount: BigInt): void {
  if (amount.lt(BIGINT_ZERO)) {
    log.critical("Invalid deposit amount: {}", [amount.toString()]);
  }
  const market = getMarket(event.address);
  const asset = getOrCreateToken(Address.fromString(market.inputToken));
  const deposit = new Deposit(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateLendingProtocol().id;
  deposit.to = market.id;
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = market.id;
  deposit.asset = asset.id;
  deposit.amount = amount;
  deposit.amountUSD = bigIntToBigDecimal(amount, asset.decimals).times(
    getCollateralPrice(event, event.address, asset)
  );
  deposit.save();
  updateUsageMetrics(event, event.transaction.from);
  handleMarketDeposit(event, market, deposit, asset);
  incrementProtocolDepositCount(event);
}

export function createWithdraw(event: ethereum.Event, amount: BigInt): void {
  if (amount.lt(BIGINT_ZERO)) {
    log.critical("Invalid withdraw amount: {}", [amount.toString()]);
  }
  const market = getMarket(event.address);
  const asset = getOrCreateToken(Address.fromString(market.inputToken));
  const withdraw = new Withdraw(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateLendingProtocol().id;
  withdraw.to = event.transaction.from.toHexString();
  withdraw.from = market.id;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = market.id;
  withdraw.asset = market.inputToken;
  withdraw.amount = amount;
  withdraw.amountUSD = bigIntToBigDecimal(amount, asset.decimals).times(
    getCollateralPrice(event, event.address, asset)
  );
  withdraw.save();
  updateUsageMetrics(event, event.transaction.from);
  handleMarketWithdraw(event, market, withdraw, asset);
  incrementProtocolWithdrawCount(event);
}

export function createBorrow(event: ethereum.Event, amount: BigInt): void {
  if (amount.lt(BIGINT_ZERO)) {
    log.critical("Invalid borrow amount: {}", [amount.toString()]);
  }
  const market = getMarket(event.address);
  const mai = getMaiToken();
  const borrow = new Borrow(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = getOrCreateLendingProtocol().id;
  borrow.to = event.transaction.from.toHexString();
  borrow.from = market.id;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = market.id;
  borrow.asset = mai.id;
  borrow.amount = amount;
  borrow.amountUSD = bigIntToBigDecimal(amount, mai.decimals);
  borrow.save();
  updateUsageMetrics(event, event.transaction.from);
  handleMarketBorrow(event, market, borrow);
  incrementProtocolBorrowCount(event);
}

export function createRepay(
  event: ethereum.Event,
  amount: BigInt,
  closingFee: BigInt
): void {
  if (amount.lt(BIGINT_ZERO)) {
    log.critical("Invalid repay amount: {}", [amount.toString()]);
  }
  const market = getMarket(event.address);
  const mai = getMaiToken();
  const collateral = getOrCreateToken(Address.fromString(market.inputToken));
  const repay = new Repay(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = getOrCreateLendingProtocol().id;
  repay.to = market.id;
  repay.from = event.transaction.from.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = market.id;
  repay.asset = mai.id;
  repay.amount = amount;
  repay.amountUSD = bigIntToBigDecimal(amount, mai.decimals);
  repay.save();
  updateUsageMetrics(event, event.transaction.from);
  handleMarketClosingFee(event, market, closingFee, collateral);
  handleMarketRepay(event, market, repay);
  incrementProtocolRepayCount(event);
}

export function createLiquidate(
  event: ethereum.Event,
  debtRepaid: BigInt,
  amountLiquidated: BigInt,
  closingFee: BigInt,
  liquidator: Address,
  liquidatee: string
): void {
  const market = getMarket(event.address);
  const mai = getMaiToken();
  const debtRepaidUSD = bigIntToBigDecimal(debtRepaid, mai.decimals);
  const collateral = getOrCreateToken(Address.fromString(market.inputToken));
  const liquidate = new Liquidate(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = getOrCreateLendingProtocol().id;
  liquidate.to = market.id;
  liquidate.from = liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = market.id;
  liquidate.asset = mai.id;
  liquidate.amount = amountLiquidated;
  liquidate.liquidatee = liquidatee;
  liquidate.amountUSD = bigIntToBigDecimal(
    amountLiquidated,
    collateral.decimals
  ).times(getCollateralPrice(event, event.address, collateral));
  liquidate.profitUSD = liquidate.amountUSD.minus(debtRepaidUSD);
  liquidate.save();
  updateUsageMetrics(event, liquidator);
  handleMarketClosingFee(event, market, closingFee, collateral);
  handleMarketLiquidate(event, market, liquidate, collateral);
  updateMarketBorrowBalance(
    event,
    market,
    BIGDECIMAL_ZERO.minus(debtRepaidUSD)
  );
  incrementProtocolLiquidateCount(event);
  addSupplySideRevenue(event, market, liquidate.profitUSD);
}

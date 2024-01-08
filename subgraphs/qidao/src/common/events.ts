import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";

import { bigIntToBigDecimal } from "../utils/numbers";

import {
  Borrow,
  Deposit,
  LendingProtocol,
  Liquidate,
  Market,
  Repay,
  Token,
  Withdraw,
} from "../../generated/schema";

export function createDeposit(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const deposit = new Deposit(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = market.id;
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.market = market.id;
  deposit.asset = token.id;
  deposit.amount = amount;
  deposit.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  deposit.save();
}

export function createBorrow(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const borrow = new Borrow(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  borrow.hash = event.transaction.hash.toHexString();
  borrow.logIndex = event.logIndex.toI32();
  borrow.protocol = protocol.id;
  borrow.to = event.transaction.from.toHexString();
  borrow.from = market.id;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.market = market.id;
  borrow.asset = token.id;
  borrow.amount = amount;
  borrow.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  borrow.save();
}

export function createRepay(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const repay = new Repay(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  repay.hash = event.transaction.hash.toHexString();
  repay.logIndex = event.logIndex.toI32();
  repay.protocol = protocol.id;
  repay.to = market.id;
  repay.from = event.transaction.from.toHexString();
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.market = market.id;
  repay.asset = token.id;
  repay.amount = amount;
  repay.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  repay.save();
}

export function createLiquidate(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  borrowToken: Token,
  amount: BigInt,
  debtRepaid: BigInt,
  liquidator: Address,
  liquidatee: Address,
  event: ethereum.Event
): void {
  const liquidate = new Liquidate(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  liquidate.hash = event.transaction.hash.toHexString();
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.protocol = protocol.id;
  liquidate.to = market.id;
  liquidate.from = liquidator.toHexString();
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.market = market.id;
  liquidate.asset = borrowToken.id;
  liquidate.amount = amount;
  liquidate.liquidatee = liquidatee.toHexString();
  liquidate.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  const profit = amount.minus(debtRepaid);
  liquidate.profitUSD = bigIntToBigDecimal(profit, borrowToken.decimals).times(
    borrowToken.lastPriceUSD!
  );
  liquidate.save();
}

export function createWithdraw(
  protocol: LendingProtocol,
  market: Market,
  token: Token,
  amount: BigInt,
  event: ethereum.Event
): void {
  const withdraw = new Withdraw(
    `${event.transaction.hash.toHexString()}-${event.logIndex.toString()}`
  );
  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.to = event.transaction.from.toHexString();
  withdraw.from = market.id;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.market = market.id;
  withdraw.asset = market.inputToken;
  withdraw.amount = amount;
  withdraw.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
  withdraw.save();
}

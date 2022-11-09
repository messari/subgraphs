import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Borrow,
  Deposit,
  Liquidate,
  Repay,
  Withdraw,
} from "../../generated/schema";

export function createDeposit(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  account: Address,
  amount: BigInt,
  amountUSD: BigDecimal
): Deposit {
  const deposit = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  deposit.hash = event.transaction.hash;
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.logIndex.toI32();
  deposit.gasPrice = event.transaction.gasPrice;
  deposit.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  deposit.gasLimit = event.transaction.gasLimit;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.account = account;
  deposit.market = marketID;
  deposit.position = account; // TODO add position
  deposit.asset = asset;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD;
  deposit.save();

  return deposit;

  // TODO update market values, daily values, protocol values, snapshots
}

export function createWithdraw(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  account: Address,
  amount: BigInt,
  amountUSD: BigDecimal
): Withdraw {
  const withdraw = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  withdraw.hash = event.transaction.hash;
  withdraw.nonce = event.transaction.nonce;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.gasPrice = event.transaction.gasPrice;
  withdraw.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  withdraw.gasLimit = event.transaction.gasLimit;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.account = account;
  withdraw.market = marketID;
  withdraw.position = account; // TODO add position
  withdraw.asset = asset;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD;
  withdraw.save();

  return withdraw;

  // TODO update market values, daily values, protocol values, snapshots
}

export function createBorrow(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  account: Address,
  amount: BigInt,
  amountUSD: BigDecimal
): Borrow {
  const borrow = new Borrow(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  borrow.hash = event.transaction.hash;
  borrow.nonce = event.transaction.nonce;
  borrow.logIndex = event.logIndex.toI32();
  borrow.gasPrice = event.transaction.gasPrice;
  borrow.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  borrow.gasLimit = event.transaction.gasLimit;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.account = account;
  borrow.market = marketID;
  borrow.position = account; // TODO add position
  borrow.asset = asset;
  borrow.amount = amount;
  borrow.amountUSD = amountUSD;
  borrow.save();

  return borrow;

  // TODO update market values, daily values, protocol values, snapshots
}

export function createRepay(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  account: Address,
  amount: BigInt,
  amountUSD: BigDecimal
): Repay {
  const repay = new Repay(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  repay.hash = event.transaction.hash;
  repay.nonce = event.transaction.nonce;
  repay.logIndex = event.logIndex.toI32();
  repay.gasPrice = event.transaction.gasPrice;
  repay.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  repay.gasLimit = event.transaction.gasLimit;
  repay.blockNumber = event.block.number;
  repay.timestamp = event.block.timestamp;
  repay.account = account;
  repay.market = marketID;
  repay.position = account; // TODO add position
  repay.asset = asset;
  repay.amount = amount;
  repay.amountUSD = amountUSD;
  repay.save();

  return repay;

  // TODO update market values, daily values, protocol values, snapshots
}

export function createLiquidate(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  liquidator: Address,
  borrower: Address,
  amount: BigInt,
  amountUSD: BigDecimal,
  profitUSD: BigDecimal
): Liquidate {
  const liquidate = new Liquidate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  liquidate.hash = event.transaction.hash;
  liquidate.nonce = event.transaction.nonce;
  liquidate.logIndex = event.logIndex.toI32();
  liquidate.gasPrice = event.transaction.gasPrice;
  liquidate.gasUsed = event.receipt ? event.receipt!.gasUsed : null;
  liquidate.gasLimit = event.transaction.gasLimit;
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.liquidator = liquidator;
  liquidate.liquidatee = borrower;
  liquidate.market = marketID;
  liquidate.positions = [account]; // TODO add position
  liquidate.asset = asset;
  liquidate.amount = amount;
  liquidate.amountUSD = amountUSD;
  liquidate.profitUSD = liquidate.save();

  return liquidate;

  // TODO update market values, daily values, protocol values, snapshots
}

// TODO use CometExt totalsBasic() for base token TVL and borrow amount

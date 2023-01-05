import { near, BigInt } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  Borrow,
  Repay,
  Liquidate,
} from "../../generated/schema";
import { BI_ZERO, BD_ZERO, ADDRESS_ZERO, NANOSEC_TO_SEC } from "../utils/const";
import { getOrCreateAccount } from "./account";

export function getOrCreateDeposit(
  id: string,
  receipt: near.ReceiptWithOutcome
): Deposit {
  let deposit = Deposit.load(id);
  if (!deposit) {
    deposit = new Deposit(id);
    deposit.hash = receipt.outcome.id.toBase58();
    deposit.nonce = BI_ZERO;
    deposit.logIndex = 0 as i32;
    deposit.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
    deposit.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    deposit.account = getOrCreateAccount(ADDRESS_ZERO).id;
    deposit.market = "";
    deposit.position = "";
    deposit.asset = "";
    deposit.amount = BI_ZERO;
    deposit.amountUSD = BD_ZERO;
  }
  return deposit;
}

export function getOrCreateWithdrawal(
  id: string,
  receipt: near.ReceiptWithOutcome
): Withdraw {
  let w = Withdraw.load(id);
  if (!w) {
    w = new Withdraw(id);
    w.hash = receipt.outcome.id.toBase58();
    w.nonce = BI_ZERO;
    w.logIndex = 0 as i32;
    w.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
    w.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    w.account = getOrCreateAccount(ADDRESS_ZERO).id;
    w.market = "";
    w.position = "";
    w.asset = "";
    w.amount = BI_ZERO;
    w.amountUSD = BD_ZERO;
  }
  return w;
}

export function getOrCreateBorrow(
  id: string,
  receipt: near.ReceiptWithOutcome
): Borrow {
  let b = Borrow.load(id);
  if (!b) {
    b = new Borrow(id);
    b.hash = receipt.outcome.id.toBase58();
    b.nonce = BI_ZERO;
    b.logIndex = 0 as i32;
    b.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
    b.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    b.account = getOrCreateAccount(ADDRESS_ZERO).id;
    b.market = "";
    b.position = "";
    b.asset = "";
    b.amount = BI_ZERO;
    b.amountUSD = BD_ZERO;
  }
  return b;
}

export function getOrCreateRepayment(
  id: string,
  receipt: near.ReceiptWithOutcome
): Repay {
  let r = Repay.load(id);
  if (!r) {
    r = new Repay(id);
    r.hash = receipt.outcome.id.toBase58();
    r.nonce = BI_ZERO;
    r.logIndex = 0 as i32;
    r.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
    r.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    r.account = getOrCreateAccount(ADDRESS_ZERO).id;
    r.market = "";
    r.position = "";
    r.asset = "";
    r.amount = BI_ZERO;
    r.amountUSD = BD_ZERO;
  }
  return r;
}

export function getOrCreateLiquidation(
  id: string,
  receipt: near.ReceiptWithOutcome
): Liquidate {
  let liquidate = Liquidate.load(id);
  if (!liquidate) {
    liquidate = new Liquidate(id);
    liquidate.hash = receipt.outcome.id.toBase58();
    liquidate.nonce = BI_ZERO;
    liquidate.logIndex = 0 as i32;
    liquidate.blockNumber = BigInt.fromI32(receipt.block.header.height as i32);
    liquidate.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    liquidate.liquidatee = getOrCreateAccount(ADDRESS_ZERO).id;
    liquidate.liquidator = getOrCreateAccount(ADDRESS_ZERO).id;
    liquidate.market = "";
    liquidate.position = "";
    liquidate.asset = "";
    liquidate.amount = BI_ZERO;
    liquidate.amountUSD = BD_ZERO;
    liquidate.profitUSD = BD_ZERO;
  }
  return liquidate;
}

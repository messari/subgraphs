import { BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw } from "../../generated/schema";
import { PROTOCOL_ID } from "../utils/constants";

export function createDeposit(
  event: ethereum.Event,
  accountAddress: string,
  assetAddress: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  vaultId: string // this is the strategy address
): void {
  const deposit = new Deposit(
    event.transaction.hash.toHexString().concat(`-${event.transactionLogIndex}`)
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.transaction.index.toI32();
  deposit.protocol = PROTOCOL_ID;
  deposit.to = vaultId;
  deposit.from = accountAddress;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = assetAddress;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD;

  deposit.vault = vaultId;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  accountAddress: string,
  assetAddress: string,
  amount: BigInt,
  amountUSD: BigDecimal,
  vaultId: string // this is the strategy address
): void {
  const withdraw = new Withdraw(
    event.transaction.hash.toHexString().concat(`-${event.transactionLogIndex}`)
  );

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.transaction.index.toI32();
  withdraw.protocol = PROTOCOL_ID;
  withdraw.to = accountAddress;
  withdraw.from = vaultId;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = assetAddress;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD;

  withdraw.vault = vaultId;

  withdraw.save();
}

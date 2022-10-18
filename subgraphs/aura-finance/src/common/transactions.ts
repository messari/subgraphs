import { BigInt, ethereum, BigDecimal } from "@graphprotocol/graph-ts";

import { NetworkConfigs } from "../../configurations/configure";

import {
  Vault as VaultStore,
  Deposit as DepositTransaction,
  Withdraw as WithdrawTransaction,
} from "../../generated/schema";

export function createDepositTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): DepositTransaction {
  const transactionId = "deposit"
    .concat("-")
    .concat(event.transaction.hash.toHexString());
  let depositTransaction = DepositTransaction.load(transactionId);

  if (!depositTransaction) {
    depositTransaction = new DepositTransaction(transactionId);

    depositTransaction.to = vault.id;
    depositTransaction.from = event.transaction.from.toHexString();
    depositTransaction.hash = event.transaction.hash.toHexString();
    depositTransaction.logIndex = event.transaction.index.toI32();

    depositTransaction.vault = vault.id;
    depositTransaction.protocol = NetworkConfigs.getFactoryAddress();
    depositTransaction.asset = vault.inputToken;
    depositTransaction.amount = amount;
    depositTransaction.amountUSD = amountUSD;

    depositTransaction.timestamp = event.block.timestamp;
    depositTransaction.blockNumber = event.block.number;

    depositTransaction.save();
  }

  return depositTransaction;
}

export function createWithdrawTransaction(
  vault: VaultStore,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): WithdrawTransaction {
  const withdrawTransactionId = "withdraw"
    .concat("-")
    .concat(event.transaction.hash.toHexString());

  let withdrawTransaction = WithdrawTransaction.load(withdrawTransactionId);

  if (!withdrawTransaction) {
    withdrawTransaction = new WithdrawTransaction(withdrawTransactionId);

    withdrawTransaction.vault = vault.id;
    withdrawTransaction.protocol = NetworkConfigs.getFactoryAddress();

    withdrawTransaction.to = event.transaction.to!.toHexString();
    withdrawTransaction.from = event.transaction.from.toHexString();

    withdrawTransaction.hash = event.transaction.hash.toHexString();
    withdrawTransaction.logIndex = event.transaction.index.toI32();

    withdrawTransaction.asset = vault.inputToken;
    withdrawTransaction.amount = amount;
    withdrawTransaction.amountUSD = amountUSD;

    withdrawTransaction.timestamp = event.block.timestamp;
    withdrawTransaction.blockNumber = event.block.number;

    withdrawTransaction.save();
  }

  return withdrawTransaction;
}

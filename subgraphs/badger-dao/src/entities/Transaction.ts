import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";

export function getOrCreateDeposit(hash: Bytes, logIndex: BigInt): Deposit {
  const id: string = hash
    .toHex()
    .concat("-")
    .concat(logIndex.toHex());

  let deposit = Deposit.load(id);

  if (deposit) {
    return deposit;
  }

  deposit = new Deposit(id);

  deposit.hash = hash.toHex();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = "";
  deposit.to = "";
  deposit.from = "";
  deposit.blockNumber = BIGINT_ZERO;
  deposit.timestamp = BIGINT_ZERO;
  deposit.vault = "";
  deposit.asset = "";
  deposit.amount = BIGINT_ZERO;
  deposit.amountUSD = BIGDECIMAL_ZERO;
  deposit.save();

  return deposit;
}

export function getOrCreateWithdraw(hash: Bytes, logIndex: BigInt): Withdraw {
  const id: string = hash
    .toHex()
    .concat("-")
    .concat(logIndex.toHex());

  let withdraw = Withdraw.load(id);

  if (withdraw) {
    return withdraw;
  }

  withdraw = new Withdraw(id);

  withdraw.hash = hash.toHex();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = "";
  withdraw.to = "";
  withdraw.from = "";
  withdraw.blockNumber = BIGINT_ZERO;
  withdraw.timestamp = BIGINT_ZERO;
  withdraw.vault = "";
  withdraw.asset = "";
  withdraw.amount = BIGINT_ZERO;
  withdraw.amountUSD = BIGDECIMAL_ZERO;
  withdraw.save();

  return withdraw;
}

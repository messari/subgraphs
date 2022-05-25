import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../constant";
import { getOrCreateProtocol } from "./Protocol";

export function getOrCreateDeposit(hash: Bytes, logIndex: BigInt, block: ethereum.Block): Deposit {
  const id: string = "deposit-"
    .concat(hash.toHex())
    .concat("-")
    .concat(logIndex.toHex());

  let deposit = Deposit.load(id);

  if (deposit) {
    return deposit;
  }

  deposit = new Deposit(id);

  deposit.hash = hash.toHex();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = getOrCreateProtocol().id;
  deposit.to = "";
  deposit.from = "";
  deposit.blockNumber = block.number;
  deposit.timestamp = block.timestamp;
  deposit.vault = "";
  deposit.asset = "";
  deposit.amount = BIGINT_ZERO;
  deposit.amountUSD = BIGDECIMAL_ZERO;
  deposit.save();

  return deposit;
}

export function getOrCreateWithdraw(hash: Bytes, logIndex: BigInt, block: ethereum.Block): Withdraw {
  const id: string = "withdraw-"
    .concat(hash.toHex())
    .concat("-")
    .concat(logIndex.toHex());

  let withdraw = Withdraw.load(id);

  if (withdraw) {
    return withdraw;
  }

  withdraw = new Withdraw(id);

  withdraw.hash = hash.toHex();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = getOrCreateProtocol().id;
  withdraw.to = "";
  withdraw.from = "";
  withdraw.blockNumber = block.number;
  withdraw.timestamp = block.timestamp;
  withdraw.vault = "";
  withdraw.asset = "";
  withdraw.amount = BIGINT_ZERO;
  withdraw.amountUSD = BIGDECIMAL_ZERO;
  withdraw.save();

  return withdraw;
}

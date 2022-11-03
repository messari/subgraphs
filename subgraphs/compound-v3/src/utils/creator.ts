import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Deposit } from "../../generated/schema";

export function createDeposit(
  event: ethereum.Event,
  marketID: Address,
  asset: Address,
  account: Address,
  amount: BigInt,
  amountUSD: BigDecimal
): Deposit {
  const deposit = new Deposit(
    event.transaction.hash.concatI32(event.transaction.index.toI32())
  );
  deposit.hash = event.transaction.hash;
  deposit.nonce = event.transaction.nonce;
  deposit.logIndex = event.transaction.index.toI32();
  deposit.gasPrice = event.transaction.gasPrice;
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
}

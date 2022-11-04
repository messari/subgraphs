import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw } from "../../generated/schema";

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

// TODO use CometExt totalsBasic() for base token TVL and borrow amount

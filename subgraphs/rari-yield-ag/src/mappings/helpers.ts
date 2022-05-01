// helper functions for ./mappings.ts

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { RARI_DEPLOYER } from "../common/utils/constants";
import { Deposit, Withdraw } from "../../generated/schema";

let codes = [
  "0xa5e92f3efb6826155f1f728e162af9d7cda33a574a1153b58f03ea01cc37e568",
  "0x8b1a1d9c2b109e527c9134b25b1a1833b16b6594f92daa9f6d9b7a6024bce9d0",
  "0xd6aca1be9729c13d677335161321649cccae6a591554772516700f986f942eaa",
  "0x33d80a03b5585b94e68b56bdea4f57fd2e459401902cb2f61772e1b630afb4b2",
];

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  asset: Address,
  vault: string,
  code: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let deposit = new Deposit(id);

  // TODO: getOrCreate asset (deposited token)
  if (!codes.includes(code)) {
    deposit.currencyCode = code;
  }

  // fill in vars
  deposit.hash = hash.toHexString();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = RARI_DEPLOYER;
  deposit.to = event.address.toHexString();
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = asset.toHexString();
  deposit.amount = amount;
  deposit.amountUSD = amountUSD.toBigDecimal(); // TODO: exponentToBigDecimal(decimals)
  deposit.vault = vault;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  asset: Address,
  vault: string,
  code: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let withdraw = new Withdraw(id);

  // TODO: getOrCreate asset (deposited token)
  if (!codes.includes(code)) {
    withdraw.currencyCode = code;
  }

  // populate vars,
  withdraw.hash = hash.toHexString();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = RARI_DEPLOYER;
  withdraw.to = event.address.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = asset.toHexString(); // TODO: fix
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD.toBigDecimal(); // TODO: fix
  withdraw.vault = vault;

  withdraw.save();
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// TODO

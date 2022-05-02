// helper functions for ./mappings.ts

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { RARI_DEPLOYER } from "../common/utils/constants";
import { Deposit, Withdraw } from "../../generated/schema";
import { getOrCreateToken } from "../common/getters";
import { exponentToBigDecimal } from "../common/utils/utils";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  asset: string,
  vault: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let deposit = new Deposit(id);

  // get (or create) asset
  let token = getOrCreateToken(asset);

  // fill in vars
  deposit.hash = hash.toHexString();
  deposit.logIndex = logIndex.toI32();
  deposit.protocol = RARI_DEPLOYER;
  deposit.to = event.address.toHexString();
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.asset = token.id;
  deposit.amount = amount;
  deposit.amountUSD = amountUSD.toBigDecimal().div(exponentToBigDecimal(token.decimals));
  deposit.vault = vault;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  asset: string,
  vault: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let withdraw = new Withdraw(id);

  // get (or create) token
  let token = getOrCreateToken(asset);

  // populate vars,
  withdraw.hash = hash.toHexString();
  withdraw.logIndex = logIndex.toI32();
  withdraw.protocol = RARI_DEPLOYER;
  withdraw.to = event.address.toHexString();
  withdraw.from = event.transaction.from.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.asset = token.id;
  withdraw.amount = amount;
  withdraw.amountUSD = amountUSD.toBigDecimal().div(exponentToBigDecimal(token.decimals));
  withdraw.vault = vault;

  withdraw.save();
}

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// TODO

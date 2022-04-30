// helper functions for ./mappings.ts

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { RARI_DEPLOYER } from "../common/utils/constants";
import { Deposit } from "../../generated/schema";

//////////////////////////////
//// Transaction Entities ////
//////////////////////////////

export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  amountUSD: BigInt,
  asset: Address,
  vault: string,
): void {
  // create id
  let hash = event.transaction.hash;
  let logIndex = event.transaction.index;
  let id = hash.toHexString() + "-" + logIndex.toString();

  // create Deposit
  let deposit = new Deposit(id);

  // TODO: getOrCreate asset (deposited token)

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

/////////////////////////
//// Updates Helpers ////
/////////////////////////

// TODO

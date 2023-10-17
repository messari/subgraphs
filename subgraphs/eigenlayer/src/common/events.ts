import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

import { BIGDECIMAL_ZERO, ZERO_ADDRESS } from "./constants";
import { getUsdPrice } from "../prices";
import { getOrCreateAccount, getOrCreateToken, getPool } from "./getters";
import {
  addToArrayAtIndex,
  bigIntToBigDecimal,
  removeFromArrayAtIndex,
} from "./utils";
import { updateTVL, updateVolume } from "./metrics";
import { NetworkConfigs } from "../../configurations/configure";

import { Deposit, Withdraw } from "../../generated/schema";

export function createDeposit(
  poolAddress: Address,
  tokenAddress: Address,
  accountAddress: Address,
  shares: BigInt,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): Bytes {
  const id = Bytes.empty()
    .concat(event.transaction.hash)
    .concatI32(event.logIndex.toI32());

  const depositEvent = new Deposit(id);
  depositEvent.hash = event.transaction.hash;
  depositEvent.logIndex = event.logIndex.toI32();
  depositEvent.protocol = NetworkConfigs.getFactoryAddress();
  depositEvent.to = event.transaction.to
    ? event.transaction.to!
    : Address.fromString(ZERO_ADDRESS);
  depositEvent.from = event.transaction.from;
  depositEvent.depositor = accountAddress;
  depositEvent.pool = poolAddress;
  depositEvent.token = tokenAddress;
  depositEvent.shares = shares;
  depositEvent.amount = amount;
  depositEvent.amountUSD = amountUSD;
  depositEvent.blockNumber = event.block.number;
  depositEvent.timestamp = event.block.timestamp;

  depositEvent.save();
  return depositEvent.id;
}

export function createWithdraw(
  poolAddress: Address,
  tokenAddress: Address,
  accountAddress: Address,
  withdrawerAddress: Address,
  delegatedAddress: Address,
  withdrawalRoot: Bytes,
  nonce: BigInt,
  shares: BigInt,
  amount: BigInt,
  amountUSD: BigDecimal,
  event: ethereum.Event
): Bytes {
  const id = Bytes.empty()
    .concat(event.transaction.hash)
    .concatI32(event.logIndex.toI32());

  const withdrawEvent = new Withdraw(id);
  withdrawEvent.hash = event.transaction.hash;
  withdrawEvent.logIndex = event.logIndex.toI32();
  withdrawEvent.protocol = NetworkConfigs.getFactoryAddress();
  withdrawEvent.to = event.transaction.to
    ? event.transaction.to!
    : Address.fromString(ZERO_ADDRESS);
  withdrawEvent.from = event.transaction.from;
  withdrawEvent.depositor = accountAddress;
  withdrawEvent.withdrawer = withdrawerAddress;
  withdrawEvent.delegatedTo = delegatedAddress;
  withdrawEvent.withdrawalRoot = withdrawalRoot;
  withdrawEvent.nonce = nonce;
  withdrawEvent.pool = poolAddress;
  withdrawEvent.token = tokenAddress;
  withdrawEvent.shares = shares;
  withdrawEvent.amount = amount;
  withdrawEvent.amountUSD = amountUSD;
  withdrawEvent.blockNumber = event.block.number;
  withdrawEvent.timestamp = event.block.timestamp;

  // Populated on WithdrawalCompleted event
  withdrawEvent.completed = false;

  withdrawEvent.save();
  return withdrawEvent.id;
}

export function completeWithdraw(
  accountAddress: Address,
  nonce: BigInt,
  event: ethereum.Event
): void {
  let found = false;
  const account = getOrCreateAccount(accountAddress);

  for (let i = 0; i < account.withdrawsQueued.length; i++) {
    const id = account.withdrawsQueued[i];
    const withdrawEvent = Withdraw.load(id)!;

    if (
      withdrawEvent.depositor == accountAddress &&
      withdrawEvent.nonce == nonce
    ) {
      found = true;

      // const token = getOrCreateToken(
      //   Address.fromBytes(withdrawEvent.token),
      //   event
      // );
      // let amountUSD = getUsdPrice(
      //   Address.fromBytes(token.id),
      //   bigIntToBigDecimal(withdrawEvent.amount, token.decimals),
      //   event.block
      // );

      // withdrawEvent.amountUSD = amountUSD;
      withdrawEvent.completed = true;
      withdrawEvent.save();

      account.withdrawsQueued = removeFromArrayAtIndex(
        account.withdrawsQueued,
        i
      );
      account.withdrawsCompleted = addToArrayAtIndex(
        account.withdrawsCompleted,
        withdrawEvent.id
      );
      account.save();

      // updateTVL(
      //   Address.fromBytes(withdrawEvent.pool),
      //   false,
      //   withdrawEvent.amount,
      //   event
      // );
      // updateVolume(
      //   Address.fromBytes(withdrawEvent.pool),
      //   false,
      //   withdrawEvent.amount,
      //   event
      // );
      break;
    }
  }

  if (!found) {
    log.warning(
      "[completeWithdraw] queued withdraw transaction not found for depositor: {} and nonce: {}",
      [accountAddress.toHexString(), nonce.toString()]
    );
  }
}

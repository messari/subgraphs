import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";

import { BIGDECIMAL_ZERO, BIGINT_ZERO, ZERO_ADDRESS } from "./constants";
import { getOrCreateAccount, getOrCreateToken } from "./getters";
import {
  addToArrayAtIndex,
  bigIntToBigDecimal,
  removeFromArrayAtIndex,
} from "./utils";
import { NetworkConfigs } from "../../configurations/configure";

import { Deposit, Withdraw } from "../../generated/schema";

export function createDeposit(
  poolAddress: Address,
  tokenAddress: Address,
  accountAddress: Address,
  shares: BigInt,
  amount: BigInt,
  event: ethereum.Event
): Bytes {
  const token = getOrCreateToken(tokenAddress, event);
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
  depositEvent.amountUSD = bigIntToBigDecimal(amount, token.decimals).times(
    token.lastPriceUSD!
  );
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
  withdrawEvent.blockNumber = event.block.number;
  withdrawEvent.timestamp = event.block.timestamp;

  // Populated on WithdrawalCompleted event
  withdrawEvent.completed = false;
  withdrawEvent.hashCompleted = Bytes.empty();
  withdrawEvent.amount = BIGINT_ZERO;
  withdrawEvent.amountUSD = BIGDECIMAL_ZERO;

  withdrawEvent.save();

  const account = getOrCreateAccount(accountAddress);
  account.withdrawsQueued = addToArrayAtIndex(
    account.withdrawsQueued,
    withdrawEvent.id
  );
  account.save();

  return withdrawEvent.id;
}

export function getWithdraw(
  accountAddress: Address,
  withdrawalRoot: Bytes
): Withdraw | null {
  const account = getOrCreateAccount(accountAddress);

  for (let i = 0; i < account.withdrawsQueued.length; i++) {
    const id = account.withdrawsQueued[i];
    const withdrawEvent = Withdraw.load(id)!;

    if (withdrawEvent.withdrawalRoot == withdrawalRoot) {
      return withdrawEvent;
    }
  }

  log.warning(
    "[getWithdraw] queued withdraw transaction not found for depositor: {} and withdrawalRoot: {}",
    [accountAddress.toHexString(), withdrawalRoot.toHexString()]
  );
  return null;
}

export function updateWithdraw(
  accountAddress: Address,
  tokenAddress: Address,
  withdrawID: Bytes,
  amount: BigInt,
  event: ethereum.Event
): void {
  const token = getOrCreateToken(tokenAddress, event);

  const withdrawEvent = Withdraw.load(withdrawID)!;
  withdrawEvent.amount = amount;
  withdrawEvent.amountUSD = bigIntToBigDecimal(amount).times(
    token.lastPriceUSD!
  );
  withdrawEvent.hashCompleted = event.transaction.hash;
  withdrawEvent.completed = true;
  withdrawEvent.blockNumberCompleted = event.block.number;
  withdrawEvent.save();

  const account = getOrCreateAccount(accountAddress);
  const i = account.withdrawsQueued.indexOf(withdrawID);
  account.withdrawsQueued = removeFromArrayAtIndex(account.withdrawsQueued, i);
  account.withdrawsCompleted = addToArrayAtIndex(
    account.withdrawsCompleted,
    withdrawEvent.id
  );
  account.save();
}

import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  FraxDUSDStake,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  Transfer as TransferEvent,
  UpdateLiquidityLimit as UpdateLiquidityLimitEvent
} from "../generated/FraxDUSDStake/FraxDUSDStake";
import { 
  Account, 
  Deposit, 
  Withdraw, 
  Transfer, 
  LiquidityLimit 
} from "../generated/schema";

export function handleDeposit(event: DepositEvent): void {
  // Create unique ID for the deposit
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let deposit = new Deposit(id);

  // Set deposit properties from event
  deposit.provider = event.params.provider;
  deposit.value = event.params.value;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;

  // Get or create account just for the relationship
  let accountId = event.params.provider.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.address = event.params.provider;
    account.balance = BigInt.fromI32(0);
    account.save();
  }
  
  deposit.account = accountId;
  deposit.save();
}

export function handleWithdraw(event: WithdrawEvent): void {
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let withdraw = new Withdraw(id);

  withdraw.provider = event.params.provider;
  withdraw.value = event.params.value;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.transactionHash = event.transaction.hash;

  let accountId = event.params.provider.toHexString();
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.address = event.params.provider;
    account.balance = BigInt.fromI32(0);
    account.save();
  }

  withdraw.account = accountId;
  withdraw.save();
}

export function handleTransfer(event: TransferEvent): void {
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let transfer = new Transfer(id);

  transfer.from = event.params._from;
  transfer.to = event.params._to;
  transfer.value = event.params._value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;

  // Update sender balance (if not address zero)
  if (event.params._from.toHexString() != "0x0000000000000000000000000000000000000000") {
    let fromAccountId = event.params._from.toHexString();
    let fromAccount = Account.load(fromAccountId);
    if (fromAccount) {
      fromAccount.balance = fromAccount.balance.minus(event.params._value);
      fromAccount.save();
    }
  }

  // Update receiver balance (if not address zero)
  if (event.params._to.toHexString() != "0x0000000000000000000000000000000000000000") {
    let toAccountId = event.params._to.toHexString();
    let toAccount = Account.load(toAccountId);
    if (!toAccount) {
      toAccount = new Account(toAccountId);
      toAccount.address = event.params._to;
      toAccount.balance = BigInt.fromI32(0);
    }
    toAccount.balance = toAccount.balance.plus(event.params._value);
    toAccount.save();
  }

  transfer.save();
}

export function handleUpdateLiquidityLimit(event: UpdateLiquidityLimitEvent): void {
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let liquidityLimit = new LiquidityLimit(id);

  liquidityLimit.accountEntity = event.params.user.toHexString();
  liquidityLimit.account = event.params.user;
  liquidityLimit.originalBalance = event.params.original_balance;
  liquidityLimit.originalSupply = event.params.original_supply;
  liquidityLimit.workingBalance = event.params.working_balance;
  liquidityLimit.workingSupply = event.params.working_supply;
  liquidityLimit.timestamp = event.block.timestamp;
  liquidityLimit.blockNumber = event.block.number;
  liquidityLimit.transactionHash = event.transaction.hash;

  liquidityLimit.save();
}
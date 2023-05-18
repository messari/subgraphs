import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../configurations/configure";
import { Deposit, Withdraw } from "../../generated/schema";
import { getOrCreateToken } from "../common/tokens";
import { getUSDAmount } from "../price";
import { getOrCreateAccount } from "./account";
import { getOrCreatePool, handlePoolDeposit, handlePoolWithdraw } from "./pool";
import { getOrCreateOpynProtocol } from "./protocol";
import { takeSnapshots } from "./snapshot";
import {
  incrementProtocolDepositCount,
  incrementProtocolWithdrawCount,
} from "./usage";

export function createDeposit(
  event: ethereum.Event,
  asset: Address,
  amount: BigInt,
  from: Address
): void {
  const account = getOrCreateAccount(from);
  const token = getOrCreateToken(asset);
  const pool = getOrCreatePool(token);
  takeSnapshots(event, pool);
  const deposit = new Deposit(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  deposit.hash = event.transaction.hash;
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = getOrCreateOpynProtocol().id;
  deposit.to = NetworkConfigs.getMarginPoolAddress();
  deposit.from = from;
  deposit.account = account.id;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [token.id];
  deposit.outputToken = null;
  deposit.inputTokenAmounts = [amount];
  deposit.outputTokenAmount = null;
  deposit.amountUSD = getUSDAmount(event, token, amount);
  deposit.pool = pool.id;
  deposit.save();

  handlePoolDeposit(event, pool, deposit);
  incrementProtocolDepositCount(event, account);
}

export function createWithdraw(
  event: ethereum.Event,
  asset: Address,
  amount: BigInt,
  to: Address
): void {
  const account = getOrCreateAccount(to);
  const token = getOrCreateToken(asset);
  const pool = getOrCreatePool(token);
  takeSnapshots(event, pool);
  const withdraw = new Withdraw(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  withdraw.hash = event.transaction.hash;
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = getOrCreateOpynProtocol().id;
  withdraw.to = to;
  withdraw.from = NetworkConfigs.getMarginPoolAddress();
  withdraw.account = account.id;
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokens = [token.id];
  withdraw.outputToken = null;
  withdraw.inputTokenAmounts = [amount];
  withdraw.outputTokenAmount = null;
  withdraw.amountUSD = getUSDAmount(event, token, amount);
  withdraw.pool = pool.id;
  withdraw.save();

  handlePoolWithdraw(event, pool, withdraw);
  incrementProtocolWithdrawCount(event, account);
}

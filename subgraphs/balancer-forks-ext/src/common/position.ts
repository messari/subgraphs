import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Account,
  Deposit,
  LiquidityPool,
  Position,
  PositionSnapshot,
  Withdraw,
  _PositionCounter,
} from "../../generated/schema";

import {  BIGINT_ZERO,  UsageType } from "./constants";
import { getLiquidityPool, getOrCreateDex } from "./getters";
import { addToArrayAtIndex} from "./utils/arrays";

export function getOrCreateAccount(accountId: string, isTrader: boolean = false): Account {
  let account = Account.load(accountId);
  let protocol = getOrCreateDex();

  if (!account) {
    account = new Account(accountId);
    account.positionCount = 0;

    account.openPositionCount = 0;
    account.closedPositionCount = 0;

    account.depositCount = 0;
    account.withdrawCount = 0;
    account.swapCount = 0;
    account.save();

    protocol.cumulativeUniqueUsers += 1;
  }

  if (isTrader && protocol.traders.indexOf(account.id) < 0) {
    protocol.traders = addToArrayAtIndex(protocol.traders, account.id, 0);
    protocol.cumulativeUniqueTraders = protocol.traders.length;
  } else if (protocol.LPs.indexOf(account.id) < 0) {
    protocol.LPs = addToArrayAtIndex(protocol.LPs, account.id, 0);
    protocol.cumulativeUniqueLPs = protocol.LPs.length;
  }
  protocol.save();

  return account;
}

export function getOrCreatePosition(poolId: string, accountId: string, event: ethereum.Event): Position {
  let positionIdPrefix = `${accountId}-${poolId}`;

  let positionCounter = _PositionCounter.load(positionIdPrefix);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(positionIdPrefix);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }
  let positionId = `${positionIdPrefix}-${positionCounter.nextCount.toString()}`;
  let position = Position.load(positionId);

  if (position) {
    return position;
  }

  position = new Position(positionId);

  let account = getOrCreateAccount(accountId);
  account.positionCount += 1;
  account.openPositionCount += 1;
  account.save();

  let pool = getLiquidityPool(poolId);
  pool.positionCount += 1;
  pool.openPositionCount += 1;
  pool.save();

  let protocol = getOrCreateDex();
  protocol.openPositionCount += 1;
  protocol.cumulativePositionCount += 1;
  protocol.save();

  position.account = accountId;
  position.pool = poolId;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.inputTokenBalances = [];
  position.outputTokenBalance = BIGINT_ZERO;
  position.save();

  return position;
}

export function updatePositions(
  poolId: string,
  eventType: string,
  accountId: string,
  event: ethereum.Event,
  eventId: string,
): void {
  let pool = getLiquidityPool(poolId);
  if (!pool) {
    return;
  }

  //  position is the current open position or a newly create open position
  let account = getOrCreateAccount(accountId);
  let position = getOrCreatePosition(poolId, accountId, event);
  let closePositionToggle = false;

  if (eventType == UsageType.DEPOSIT) {
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;

    let deposit = Deposit.load(eventId)!;
    position.inputTokenBalances = [];
    position.outputTokenBalance = position.outputTokenBalance.plus(deposit.outputTokenAmount!);
  } else if (eventType == UsageType.WITHDRAW) {
    account.withdrawCount = account.depositCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    let withdraw = Withdraw.load(eventId)!;
    position.inputTokenBalances = [];
    position.outputTokenBalance = position.outputTokenBalance.minus(withdraw.outputTokenAmount!);

    if (position.outputTokenBalance.equals(BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  }

  position.save();
  account.save();
  takePositionSnapshot(position, event);
  if (closePositionToggle) {
    closePosition(position, account, pool, event);
  }
}

export function takePositionSnapshot(position: Position, event: ethereum.Event): void {
  let hash = event.transaction.hash.toHexString();
  let txLogIndex = event.transactionLogIndex.toI32();
  let snapshot = new PositionSnapshot(`${position.id}-${hash}-${txLogIndex}`);

  snapshot.position = position.id;
  snapshot.hash = hash;
  snapshot.logIndex = txLogIndex;
  snapshot.nonce = event.transaction.nonce;
  snapshot.inputTokenBalances = position.inputTokenBalances;
  snapshot.outputTokenBalance = position.outputTokenBalance;
  snapshot.cumulativeRewardTokenAmounts = position.cumulativeRewardTokenAmounts;

  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function closePosition(position: Position, account: Account, pool: LiquidityPool, event: ethereum.Event): void {
  let positionIdPrefix = `${account.id}-${pool.id}`;
  let positionCounter = _PositionCounter.load(positionIdPrefix)!;
  positionCounter.nextCount += 1;
  positionCounter.save();

  account.openPositionCount -= 1;
  account.closedPositionCount += 1;
  account.save();

  pool.openPositionCount -= 1;
  pool.closedPositionCount += 1;
  pool.save();

  let protocol = getOrCreateDex();
  protocol.openPositionCount -= 1;
  protocol.save();

  position.hashClosed = event.transaction.hash.toHexString();
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
  position.save();
}

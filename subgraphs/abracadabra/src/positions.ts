import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveEventAccount,
  Borrow,
  Deposit,
  Liquidate,
  Market,
  Position,
  PositionSnapshot,
  Repay,
  Withdraw,
} from "../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO, EventType, InterestRateSide, SECONDS_PER_DAY } from "./common/constants";
import { getMarket, getOrCreateLendingProtocol, getOrCreateUsageMetricsDailySnapshot } from "./common/getters";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "./common/utils/arrays";

export function getOrCreateAccount(accountId: string, event: ethereum.Event): Account {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
    account.positionCount = 0;

    account.openPositions = [];
    account.openPositionCount = 0;

    account.closedPositions = [];
    account.closedPositionCount = 0;

    account.depositCount = 0;
    account.withdrawCount = 0;
    account.borrowCount = 0;
    account.repayCount = 0;

    account.liquidateCount = 0;
    account.liquidationCount = 0;
    account.save();

    let protocol = getOrCreateLendingProtocol();
    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  return account;
}

export function getOrCreatePosition(
  side: string,
  marketId: string,
  accountId: string,
  event: ethereum.Event,
): Position {
  let positionIdPrefix = `${accountId}-${marketId}-${side}`;
  let account = getOrCreateAccount(accountId, event);

  log.info("[getOrCreatePosition][Hash:{}][Prefix:{}]OpenCount:{}|Pos:{}|ClosedPos:{}|Pos:{}", [
    event.transaction.hash.toHexString(),
    positionIdPrefix.toString(),
    account.openPositionCount.toString(),
    account.openPositions.toString(),
    account.closedPositionCount.toString(),
    account.closedPositions.toString(),
  ]);

  for (let curr = 0; curr < account.openPositionCount; curr += 1) {
    let op = account.openPositions.at(curr);
    if (op.startsWith(positionIdPrefix)) {
      return Position.load(op)!;
    }
  }

  let count = 0;
  for (let curr = 0; curr < account.closedPositionCount; curr += 1) {
    let cp = account.closedPositions.at(curr);
    if (cp.startsWith(positionIdPrefix)) {
      count += 1;
    }
  }

  let positionId = `${accountId}-${marketId}-${side}-${count}`;
  let position = new Position(positionId);

  log.info("[getOrCreatePosition][Hash:{}][ID:{}] Created!", [event.transaction.hash.toHexString(), positionId]);

  account.openPositionCount += 1;
  account.openPositions = addToArrayAtIndex(account.openPositions, positionId, 0);
  account.save();

  let market = getMarket(marketId);
  market!.positionCount += 1;
  market!.openPositionCount += 1;
  if (side == "LENDER") {
    market!.lendingPositionCount += 1;
  } else if (side == "BORROWER") {
    market!.borrowingPositionCount += 1;
  }
  market!.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount += 1;
  protocol.cumulativePositionCount += 1;
  protocol.save();

  position.account = accountId;
  position.market = marketId;
  position.side = side;
  position.count = count;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.balance = BIGINT_ZERO;
  position.isCollateral = market!.canUseAsCollateral;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.borrowCount = 0;
  position.repayCount = 0;
  position.liquidationCount = 0;
  position.save();

  log.info("created new position {}, protocol openCount: {}, account openCount: {}, Txhash: {}", [
    positionId,
    protocol.openPositionCount.toString(),
    account.openPositionCount.toString(),
    event.transaction.hash.toHexString(),
  ]);
  return position;
}

export function addAccountToProtocol(eventType: string, account: Account, event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtocol();
  let dailyId: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();

  let activeEventId = `hourly-${account.id}-${dailyId}-${eventType}`;
  let activeEvent = ActiveEventAccount.load(activeEventId);

  let dailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  if (eventType == EventType.DEPOSIT) {
    if (protocol.depositors.indexOf(account.id) < 0) {
      protocol.depositors = addToArrayAtIndex(protocol.depositors, account.id, 0);
      protocol.cumulativeUniqueDepositors = protocol.depositors.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveDepositors += 1;
    }
  } else if (eventType == EventType.BORROW) {
    if (protocol.borrowers.indexOf(account.id) < 0) {
      protocol.borrowers = addToArrayAtIndex(protocol.borrowers, account.id, 0);
      protocol.cumulativeUniqueBorrowers = protocol.borrowers.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveBorrowers += 1;
    }
  } else if (eventType == EventType.LIQUIDATOR) {
    if (protocol.liquidators.indexOf(account.id) < 0) {
      protocol.liquidators = addToArrayAtIndex(protocol.liquidators, account.id, 0);
      protocol.cumulativeUniqueLiquidators = protocol.liquidators.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidators += 1;
    }
  } else if (eventType == EventType.LIQUIDATEE) {
    if (protocol.liquidatees.indexOf(account.id) < 0) {
      protocol.liquidatees = addToArrayAtIndex(protocol.liquidatees, account.id, 0);
      protocol.cumulativeUniqueLiquidatees += 1;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidatees += 1;
    }
  }
  activeEvent!.save();
  protocol.save();
  dailySnapshot.save();
}

export function updatePositions(
  marketId: string,
  eventType: string,
  amount: BigInt,
  accountId: string,
  event: ethereum.Event,
  eventId: string,
  liquidation: boolean = false,
): void {
  let market = getMarket(marketId);
  if (!market) {
    return;
  }
  let position = getOrCreatePosition(InterestRateSide.LENDER, marketId, accountId, event);
  if ([EventType.BORROW, EventType.REPAY].includes(eventType)) {
    position = getOrCreatePosition(InterestRateSide.BORROW, marketId, accountId, event);
  }
  //  position is the current open position or a newly create open position

  let closePositionToggle = false;
  let account = getOrCreateAccount(accountId, event);

  if (eventType == EventType.DEPOSIT) {
    addAccountToProtocol(eventType, account, event);
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;
    position.balance = position.balance.plus(amount);
    let deposit = new Deposit(eventId);
    deposit.position = position.id;
    deposit.save();
  } else if (eventType == EventType.WITHDRAW) {
    account.withdrawCount = account.depositCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    position.balance = position.balance.minus(amount);
    if (liquidation) {
      position.liquidationCount = position.liquidationCount + 1;
      let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionLogIndex
        .plus(BIGINT_ONE)
        .toString()}`;
      updateLiqudationEvent(liqudationEventId, position.id);
    }
    let withdraw = new Withdraw(eventId);
    withdraw.position = position.id;
    withdraw.save();
    if (position.balance.equals(BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  } else if (eventType == EventType.BORROW) {
    addAccountToProtocol(eventType, account, event);
    account.borrowCount = account.borrowCount + 1;
    position.borrowCount = position.borrowCount + 1;
    position.balance = position.balance.plus(amount);
    let borrow = new Borrow(eventId);
    borrow.position = position.id;
    borrow.save();
  } else if (eventType == EventType.REPAY) {
    account.repayCount = account.repayCount + 1;
    position.repayCount = position.repayCount + 1;
    position.balance = position.balance.minus(amount);
    if (liquidation) {
      position.liquidationCount = position.liquidationCount + 1;
      let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionLogIndex.toString()}`;
      updateLiqudationEvent(liqudationEventId, position.id);
    }

    let repay = new Repay(eventId);
    repay.position = position.id;
    repay.save();
    if (position.balance.equals(BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  }

  account.save();
  position.save();
  takePositionSnapshot(position, event);
  if (closePositionToggle) {
    closePosition(position, account, market, event);
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
  snapshot.balance = position.balance;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function closePosition(position: Position, account: Account, market: Market, event: ethereum.Event): void {
  let account_index = account.openPositions.indexOf(position.id);
  account.openPositionCount -= 1;
  account.openPositions = removeFromArrayAtIndex(account.openPositions, account_index);
  account.closedPositionCount += 1;
  account.closedPositions = addToArrayAtIndex(account.closedPositions, position.id, 0);
  account.save();

  market.openPositionCount -= 1;
  market.closedPositionCount += 1;
  market.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();

  position.hashClosed = event.transaction.hash.toHexString();
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
  position.save();
}

function updateLiqudationEvent(liqudationEventId: string, positionId: string): void {
  let liquidation = new Liquidate(liqudationEventId);
  liquidation.position = positionId;
  liquidation.save();
}

import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveEventAccount,
  Borrow,
  Deposit,
  Liquidate,
  Position,
  PositionSnapshot,
  Repay,
  Withdraw,
} from "../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO, SECONDS_PER_DAY } from "./common/constants";
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
  position.account = accountId;
  position.market = marketId;

  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.side = side;
  position.balance = BIGINT_ZERO;
  position.depositCount = 0;
  position.deposits = [];
  position.withdrawCount = 0;
  position.withdraws = [];
  position.borrowCount = 0;
  position.borrows = [];
  position.repayCount = 0;
  position.repays = [];
  position.liquidationCount = 0;
  position.liquidations = [];
  position.save();

  account.openPositionCount += 1;
  account.openPositions = addToArrayAtIndex(account.openPositions, positionId, 0);
  account.save();

  let market = getMarket(marketId);
  market!.positionCount += 1;
  market!.openPositionCount += 1;
  market!.openPositions = addToArrayAtIndex(market!.openPositions, positionId, 0);
  if (side == "LENDER") {
    market!.lendingPositionCount += 1;
    market!.lendingPositions = addToArrayAtIndex(market!.lendingPositions, position.id, 0);
  } else if (side == "BORROWER") {
    market!.borrowingPositionCount += 1;
    market!.borrowingPositions = addToArrayAtIndex(market!.borrowingPositions, position.id, 0);
  }
  market!.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount += 1;
  protocol.cumulativePositionCount += 1;
  protocol.save();
  return position;
}

export function addAccountToProtocol(eventType: string, account: Account, event: ethereum.Event): void {
  let protocol = getOrCreateLendingProtocol();
  let dailyId: string = (event.block.timestamp.toI64() / SECONDS_PER_DAY).toString();

  let activeEventId = `hourly-${account.id}-${dailyId}-${eventType}`;
  let activeEvent = ActiveEventAccount.load(activeEventId);

  let dailySnapshot = getOrCreateUsageMetricsDailySnapshot(event);

  if (eventType == "DEPOSIT") {
    if (protocol.depositors.indexOf(account.id) < 0) {
      protocol.depositors = addToArrayAtIndex(protocol.depositors, account.id, 0);
      protocol.cumulativeUniqueDepositors = protocol.depositors.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveDepositors += 1;
    }
  } else if (eventType == "BORROW") {
    if (protocol.borrowers.indexOf(account.id) < 0) {
      protocol.borrowers = addToArrayAtIndex(protocol.borrowers, account.id, 0);
      protocol.cumulativeUniqueBorrowers = protocol.borrowers.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveBorrowers += 1;
    }
  } else if (eventType == "LIQUIDATOR") {
    if (protocol.liquidators.indexOf(account.id) < 0) {
      protocol.liquidators = addToArrayAtIndex(protocol.liquidators, account.id, 0);
      protocol.cumulativeUniqueLiquidators = protocol.liquidators.length;
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      dailySnapshot.dailyActiveLiquidators += 1;
    }
  } else if (eventType == "LIQUIDATEE") {
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
  let account = getOrCreateAccount(accountId, event);
  let protocol = getOrCreateLendingProtocol();
  //  position is the current open position or a newly create open position
  let position = getOrCreatePosition("LENDER", marketId, accountId, event);

  if (eventType == "DEPOSIT") {
    addAccountToProtocol(eventType, account, event);
    position.isCollateral = market.canUseAsCollateral;
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;
    position.balance = position.balance.plus(amount);
    let deposit = new Deposit(eventId);
    deposit.position = position.id;
    deposit.save();
  } else if (eventType == "WITHDRAW") {
    position.isCollateral = market.canUseAsCollateral;
    account.withdrawCount = account.depositCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    position.balance = position.balance.minus(amount);
    if (liquidation) {
      position.liquidationCount = position.liquidationCount + 1;
      let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionLogIndex
        .plus(BIGINT_ONE)
        .toString()}`;
      let liquidation = new Liquidate(liqudationEventId);
      liquidation.position = position.id;
      liquidation.save();
    }
    let withdraw = new Withdraw(eventId);
    withdraw.position = position.id;
    withdraw.save();
    if (position.balance.equals(BIGINT_ZERO)) {
      closePosition(position, accountId, marketId, event);
    }
  } else if (eventType == "BORROW") {
    addAccountToProtocol(eventType, account, event);
    position = getOrCreatePosition("BORROWER", marketId, accountId, event);
    account.borrowCount = account.borrowCount + 1;
    position.borrowCount = position.borrowCount + 1;
    position.balance = position.balance.plus(amount);
    let borrow = new Borrow(eventId);
    borrow.position = position.id;
    borrow.save();
  } else if (eventType == "REPAY") {
    position = getOrCreatePosition("BORROWER", marketId, accountId, event);
    account.repayCount = account.repayCount + 1;
    position.repayCount = position.repayCount + 1;
    position.repays = addToArrayAtIndex(position.repays, eventId, 0);
    position.balance = position.balance.minus(amount);
    if (liquidation) {
      position.liquidationCount = position.liquidationCount + 1;
      let liqudationEventId = `liquidate-${event.transaction.hash.toHexString()}-${event.transactionLogIndex.toString()}`;
      let liquidation = new Liquidate(liqudationEventId);
      liquidation.position = position.id;
      liquidation.save();
    }

    let repay = new Repay(eventId);
    repay.position = position.id;
    repay.save();

    if (position.balance.equals(BIGINT_ZERO)) {
      closePosition(position, accountId, marketId, event);
    }
  }

  account.save();
  position.save();
  market.save();
  protocol.save();
  takePositionSnapshot(position, event);
}

export function takePositionSnapshot(position: Position, event: ethereum.Event): void {
  let dailyId: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let snapshot = new PositionSnapshot(`${position.id}-${dailyId.toString()}`);

  snapshot.position = position.id;
  snapshot.balance = position.balance;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function closePosition(position: Position, accountId: string, marketId: string, event: ethereum.Event): void {
  let account = getOrCreateAccount(accountId, event);
  let account_index = account.openPositions.indexOf(position.id);
  account.openPositions = removeFromArrayAtIndex(account.openPositions, account_index);
  account.closedPositions = addToArrayAtIndex(account.openPositions, position.id, 0);
  account.openPositionCount -= 1;
  account.closedPositionCount += 1;
  account.save();

  let market = getMarket(marketId);
  let market_index = market!.openPositions.indexOf(position.id);
  market!.openPositions = removeFromArrayAtIndex(market!.openPositions, market_index);
  market!.closedPositions = addToArrayAtIndex(market!.openPositions, position.id, 0);
  market!.openPositionCount -= 1;
  market!.closedPositionCount += 1;
  market!.save();

  let protocol = getOrCreateLendingProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();

  position.hashClosed = event.transaction.hash.toHexString();
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
  position.save();
}

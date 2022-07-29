import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import {
  Account,
  Market,
  Position,
  PositionSnapshot,
} from "../../../../generated/schema";
import { BIGINT_ZERO, INT_ZERO } from "../../../../src/utils/constants";
import { rayDiv, rayMul } from "../../../../src/utils/numbers";
import { PositionSide } from "../utils/constants";
import { getOrCreateAccount } from "./account";
import {
  closeMarketPosition,
  getMarket,
  openMarketBorrowerPosition,
  openMarketLenderPosition,
} from "./market";

export function getUserPosition(
  account: Account,
  market: Market,
  positionSide: string
): Position | null {
  const positionId = `${account.id}-${market.id}-${positionSide}`;
  const openPositions = account.openPositions;
  for (let i = 0; i < openPositions.length; i++) {
    if (openPositions[i].startsWith(positionId)) {
      return Position.load(openPositions[i])!;
    }
  }
  return null;
}

export function getOrCreateUserPosition(
  event: ethereum.Event,
  account: Account,
  market: Market,
  positionSide: string
): Position {
  let position = getUserPosition(account, market, positionSide);
  if (position != null) {
    return position;
  }
  if (PositionSide.LENDER == positionSide) {
    openMarketLenderPosition(market);
  } else {
    openMarketBorrowerPosition(market);
  }
  const positionId = `${account.id}-${market.id}-${positionSide}-${account.positionCount}`;
  position = new Position(positionId);
  position.account = account.id;
  position.market = market.id;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.side = positionSide;
  position.balance = BIGINT_ZERO;
  position.depositCount = INT_ZERO;
  position.withdrawCount = INT_ZERO;
  position.borrowCount = INT_ZERO;
  position.repayCount = INT_ZERO;
  position.liquidationCount = INT_ZERO;
  if (PositionSide.LENDER == positionSide) {
    position.isCollateral = true;
  } else {
    position._stableDebtBalance = BIGINT_ZERO;
    position._variableDebtBalance = BIGINT_ZERO;
  }
  position.save();
  const openPositions = account.openPositions;
  openPositions.push(position.id);
  account.openPositions = openPositions;
  account.openPositionCount += 1;
  account.positionCount += 1;
  account.save();
  return position;
}

export function getOrCreatePositionSnapshot(
  event: ethereum.Event,
  position: Position
): void {
  const hash = event.transaction.hash.toHexString();
  const logIndex = event.transactionLogIndex.toI32();
  const id = `${position.id}-${hash}-${logIndex}`;
  let snapshot = PositionSnapshot.load(id);
  if (!snapshot) {
    snapshot = new PositionSnapshot(id);
    snapshot.position = position.id;
  }
  snapshot.balance = position.balance;
  snapshot.hash = hash;
  snapshot.logIndex = logIndex;
  snapshot.nonce = event.transaction.nonce;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}

export function updateUserLenderPosition(
  event: ethereum.Event,
  user: Address,
  market: Market,
  newTotalBalance: BigInt
): void {
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  position.balance = newTotalBalance;
  if (position.balance.lt(BIGINT_ZERO)) {
    setBalanceToZero(position);
  }
  position.save();
  getOrCreatePositionSnapshot(event, position);
}

export function updateUserVariableBorrowerPosition(
  event: ethereum.Event,
  user: Address,
  market: Market,
  newTotalBalance: BigInt
): void {
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  position._variableDebtBalance = newTotalBalance;
  position.balance = position._variableDebtBalance!.plus(
    position._stableDebtBalance!
  );
  if (position.balance.lt(BIGINT_ZERO)) {
    setBalanceToZero(position);
  }
  position.save();
  getOrCreatePositionSnapshot(event, position);
}

export function updateUserStableBorrowerPosition(
  event: ethereum.Event,
  user: Address,
  market: Market,
  newTotalBalance: BigInt
): void {
  const account = getOrCreateAccount(user);
  const position = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  position._stableDebtBalance = newTotalBalance;
  position.balance = position._stableDebtBalance!.plus(
    position._variableDebtBalance!
  );
  if (position.balance.lt(BIGINT_ZERO)) {
    setBalanceToZero(position);
  }
  position.save();
  getOrCreatePositionSnapshot(event, position);
}

export function setUserLenderPositionIsCollateral(
  user: Address,
  marketAddress: Address,
  isCollateral: boolean
): void {
  const account = getOrCreateAccount(user);
  const position = getUserPosition(
    account,
    getMarket(marketAddress),
    PositionSide.LENDER
  );
  if (!position) {
    // Position was already closed, do nothing
    return;
  }
  position.isCollateral = isCollateral;
  position.save();
}

export function incrementPositionDepositCount(position: Position): void {
  position.depositCount += 1;
  position.save();
}

export function incrementPositionWithdrawCount(position: Position): void {
  position.withdrawCount += 1;
  position.save();
}

export function incrementPositionBorrowCount(position: Position): void {
  position.borrowCount += 1;
  position.save();
}

export function incrementPositionRepayCount(position: Position): void {
  position.repayCount += 1;
  position.save();
}

export function incrementPositionLiquidationCount(position: Position): void {
  position.liquidationCount += 1;
  position.save();
}

export function checkIfPositionClosed(
  event: ethereum.Event,
  account: Account,
  market: Market,
  position: Position
): void {
  if (position.balance.gt(BIGINT_ZERO)) {
    return;
  }
  closePosition(event, account, market, position);
}

function closePosition(
  event: ethereum.Event,
  account: Account,
  market: Market,
  position: Position
): void {
  position.blockNumberClosed = event.block.number;
  position.hashClosed = event.transaction.hash.toHexString();
  position.timestampClosed = event.block.timestamp;
  if (position.side == PositionSide.LENDER) {
    position.isCollateral = false;
  }
  position.save();

  const openPositions = account.openPositions;
  openPositions.splice(openPositions.indexOf(position.id), 1);
  account.openPositions = openPositions;
  account.openPositionCount -= 1;
  account.closedPositionCount += 1;
  account.save();
  closeMarketPosition(market);
}

function setBalanceToZero(position: Position): void {
  if (position.balance.lt(BIGINT_ZERO)) {
    log.error("Negative balance in position {}, balance: {}, setting to zero", [
      position.id,
      position.balance.toString(),
    ]);
  }
  position.balance = BIGINT_ZERO;
}

import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Account,
  Market,
  Position,
  PositionSnapshot,
  _Trove,
} from "../../generated/schema";
import { BIGINT_ZERO, INT_ZERO, LUSD_ADDRESS } from "../utils/constants";
import { PositionSide } from "../utils/constants";
import { bigIntToBigDecimal } from "../utils/numbers";
import { getOrCreateAccount } from "./account";
import { createDeposit } from "./event";
import {
  closeMarketPosition,
  getOrCreateMarket,
  openMarketBorrowerPosition,
  openMarketLenderPosition,
} from "./market";
import { getCurrentLUSDPrice } from "./token";

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

export function updateSPUserPositionBalances(
  event: ethereum.Event,
  sp: Market,
  depositor: Address,
  newBalance: BigInt
): void {
  const account = getOrCreateAccount(depositor);

  const position = getOrCreateUserPosition(
    event,
    account,
    sp,
    PositionSide.LENDER
  );

  const delta = newBalance.minus(position.balance);
  position.balance = newBalance;
  if (position.balance.equals(BIGINT_ZERO)) {
    closePosition(event, account, sp, position);
  }
  position.save();
  getOrCreatePositionSnapshot(event, position);

  const deltaUSD = getCurrentLUSDPrice().times(bigIntToBigDecimal(delta));
  if (delta.gt(BIGINT_ZERO)) {
    createDeposit(
      event,
      sp,
      Address.fromString(LUSD_ADDRESS),
      delta,
      deltaUSD,
      depositor
    );
  } // negative doesn't imply withdrawal.
}

export function updateUserPositionBalances(
  event: ethereum.Event,
  trove: _Trove
): void {
  const market = getOrCreateMarket();
  const account = getOrCreateAccount(Address.fromString(trove.id));

  const borrowerPosition = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.BORROWER
  );
  borrowerPosition.balance = trove.debt;
  if (borrowerPosition.balance.equals(BIGINT_ZERO)) {
    closePosition(event, account, market, borrowerPosition);
  }
  borrowerPosition.save();
  getOrCreatePositionSnapshot(event, borrowerPosition);

  const lenderPosition = getOrCreateUserPosition(
    event,
    account,
    market,
    PositionSide.LENDER
  );
  lenderPosition.balance = trove.collateral;
  if (lenderPosition.balance.equals(BIGINT_ZERO)) {
    closePosition(event, account, market, lenderPosition);
  }
  lenderPosition.save();
  getOrCreatePositionSnapshot(event, lenderPosition);
}

function closePosition(
  event: ethereum.Event,
  account: Account,
  market: Market,
  position: Position
): void {
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
  position.hashClosed = event.transaction.hash.toHexString();
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

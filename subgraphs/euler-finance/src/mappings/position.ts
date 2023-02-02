import { LendingProtocol, Market, Account, Position, _PositionCounter, PositionSnapshot } from "../../generated/schema";
import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import { PositionSide, BIGINT_ZERO, EventType } from "../common/constants";

export function addPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balance: BigInt,
  side: string,
  eventType: i32,
  event: ethereum.Event,
): string {
  const counterID = account.id.concat("-").concat(market.id).concat("-").concat(side);
  let positionCounter = _PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(counterID);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }
  const positionID = positionCounter.id.concat("-").concat(positionCounter.nextCount.toString());
  const position = getOrCreatePosition(positionID, protocol, account, market, side, eventType, event);
  position.balance = balance;

  if (eventType == EventType.DEPOSIT) {
    position.depositCount += 1;
  } else if (eventType == EventType.BORROW) {
    position.borrowCount += 1;
  }
  position.save();

  //
  // take position snapshot
  //
  snapshotPosition(position, event);

  return positionID;
}

function snapshotPosition(position: Position, event: ethereum.Event): void {
  const snapshot = new PositionSnapshot(
    position.id.concat("-").concat(event.transaction.hash.toHexString()).concat("-").concat(event.logIndex.toString()),
  );
  snapshot.hash = event.transaction.hash.toHexString();
  snapshot.logIndex = event.logIndex.toI32();
  snapshot.nonce = event.transaction.nonce;
  snapshot.position = position.id;
  snapshot.balance = position.balance;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;
  snapshot.save();
}

function getOrCreatePosition(
  id: string,
  protocol: LendingProtocol,
  account: Account,
  market: Market,
  side: PositionSide,
  eventType: EventType,
  event: ethereum.Event,
): Position {
  let position = Position.load(id);
  if (position) {
    return position;
  }

  position = new Position(id);
  position.account = account.id;
  position.market = market.id;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.side = side;
  if (side == PositionSide.LENDER) {
    position.isCollateral = market.canUseAsCollateral;
  }
  position.balance = BIGINT_ZERO;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.borrowCount = 0;
  position.repayCount = 0;
  position.liquidationCount = 0;
  position.save();

  // increase counters
  account.positionCount += 1;
  account.openPositionCount += 1;
  account.save();

  market.positionCount += 1;
  market.openPositionCount += 1;
  if (eventType == EventType.DEPOSIT) {
    market.lendingPositionCount += 1;
  } else if (eventType == EventType.BORROW) {
    market.borrowingPositionCount += 1;
  }
  market.save();

  protocol.cumulativePositionCount += 1;
  protocol.openPositionCount += 1;
  protocol.save();

  return position;
}

export function subtractPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balance: BigInt,
  side: string,
  eventType: i32,
  event: ethereum.Event,
): string | null {
  const counterID = account.id.concat("-").concat(market.id).concat("-").concat(side);
  const positionCounter = _PositionCounter.load(counterID);
  if (!positionCounter) {
    log.warning("[subtractPosition] position counter {} not found", [counterID]);
    return null;
  }
  const positionID = positionCounter.id.concat("-").concat(positionCounter.nextCount.toString());
  const position = Position.load(positionID);
  if (!position) {
    log.warning("[subtractPosition] position {} not found", [positionID]);
    return null;
  }

  position.balance = balance;
  if (eventType == EventType.WITHDRAW) {
    position.withdrawCount += 1;
    account.withdrawCount += 1;
  } else if (eventType == EventType.REPAY) {
    position.repayCount += 1;
    account.repayCount += 1;
  } else if (eventType == EventType.LIQUIDATEE) {
    position.liquidationCount += 1;
    account.liquidationCount += 1;
  }
  account.save();
  position.save();

  const closePosition = position.balance == BIGINT_ZERO;
  if (closePosition) {
    //
    // update position counter
    //
    positionCounter.nextCount += 1;
    positionCounter.save();

    //
    // close position
    //
    position.hashClosed = event.transaction.hash.toHexString();
    position.blockNumberClosed = event.block.number;
    position.timestampClosed = event.block.timestamp;
    position.save();

    //
    // update account position
    //
    account.openPositionCount -= 1;
    account.closedPositionCount += 1;
    account.save();

    //
    // update market position
    //
    market.openPositionCount -= 1;
    market.closedPositionCount += 1;
    market.save();

    //
    // update protocol position
    //
    protocol.openPositionCount -= 1;
    protocol.save();
  }

  //
  // update position snapshot
  //
  snapshotPosition(position, event);

  return positionID;
}

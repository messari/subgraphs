import { near, BigInt } from "@graphprotocol/graph-ts";
import {
  Position,
  PositionSnapshot,
  Account,
  Market,
} from "../../generated/schema";
import { BI_ZERO, NANOSEC_TO_SEC } from "../utils/const";

export function getOrCreatePosition(
  account: Account,
  market: Market,
  side: string,
  receipt: near.ReceiptWithOutcome,
  count: i32
): Position {
  const id = account.id
    .concat("-")
    .concat(market.id)
    .concat("-")
    .concat(side)
    .concat("-")
    .concat(count.toString());
  let position = Position.load(id);
  if (!position) {
    const currTimestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );

    position = new Position(id);
    position.account = account.id;
    position.market = market.id;
    position.hashOpened = receipt.receipt.id.toBase58();
    position.hashClosed = null;
    position.blockNumberOpened = BigInt.fromU64(receipt.block.header.height);
    position.blockNumberClosed = null;
    position.timestampOpened = currTimestamp;
    position.timestampClosed = null;
    position.side = side;
    position.isCollateral = true;
    position.balance = BI_ZERO;
    position.depositCount = 0;
    position.withdrawCount = 0;
    position.borrowCount = 0;
    position.repayCount = 0;
    position.liquidationCount = 0;
    position._lastActiveTimestamp = currTimestamp;
    position.save();

    account.openPositionCount += 1;
    account.positionCount += 1;

    market.openPositionCount += 1;
    market.positionCount += 1;
    if (side == "LENDER") {
      market.lendingPositionCount += 1;
    } else {
      market.borrowingPositionCount += 1;
    }
  }
  return position;
}

export function getOrCreatePositionSnapshot(
  position: Position,
  receipt: near.ReceiptWithOutcome
): PositionSnapshot {
  const id = position.id
    .concat("-")
    .concat(position.timestampOpened.toString());
  let snapshot = PositionSnapshot.load(id);
  if (!snapshot) {
    snapshot = new PositionSnapshot(id);
    snapshot.position = position.id;
    snapshot.timestamp = BigInt.fromU64(
      NANOSEC_TO_SEC(receipt.block.header.timestampNanosec)
    );
    snapshot.blockNumber = BigInt.fromU64(receipt.block.header.height);
    snapshot.nonce = BI_ZERO;
    snapshot.logIndex = 0;
    snapshot.hash = receipt.outcome.id.toBase58();
    snapshot.balance = position.balance;
    snapshot.save();
  }
  return snapshot;
}

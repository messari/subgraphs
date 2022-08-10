import { ethereum, BigInt, log } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveEventAccount,
  ActorAccount,
  Borrow,
  Deposit,
  LendingProtocol,
  Liquidate,
  Market,
  Position,
  PositionCounter,
  PositionSnapshot,
  Repay,
  Withdraw,
} from "../generated/schema";
import { BIGINT_ONE, BIGINT_ZERO, EventType, InterestRateSide, SECONDS_PER_DAY } from "./common/constants";
import { getMarket, getOrCreateLendingProtocol, getOrCreateUsageMetricsDailySnapshot } from "./common/getters";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "./common/utils/arrays";

// A series of side effects on position added
// They include:
// * Create a new position when needed or reuse the exisitng position
// * Update position related data in protocol, market, account
// * Take position snapshot
export function addPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balanceResult: ethereum.CallResult<BigInt>,
  side: string,
  eventType: String,
  event: ethereum.Event,
): string {
  let counterID = account.id.concat("-").concat(market.id).concat("-").concat(side);
  let positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new PositionCounter(counterID);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }
  let positionID = positionCounter.id.concat("-").concat(positionCounter.nextCount.toString());

  let position = Position.load(positionID);
  let openPosition = position == null;
  if (openPosition) {
    position = new Position(positionID);
    position.account = account.id;
    position.market = market.id;
    position.hashOpened = event.transaction.hash.toHexString();
    position.blockNumberOpened = event.block.number;
    position.timestampOpened = event.block.timestamp;
    position.side = side;
    position.balance = BIGINT_ZERO;
    position.depositCount = 0;
    position.withdrawCount = 0;
    position.borrowCount = 0;
    position.repayCount = 0;
    position.liquidationCount = 0;
    position.save();
  }
  position = position!;
  if (balanceResult.reverted) {
    log.warning("[addPosition] Fetch balance of {} from {} reverted", [account.id, market.id]);
  } else {
    position.balance = balanceResult.value;
  }
  if (eventType == EventType.DEPOSIT) {
    position.depositCount += 1;
  } else if (eventType == EventType.BORROW) {
    position.borrowCount += 1;
  }
  position.save();

  if (openPosition) {
    //
    // update account position
    //
    account.positionCount += 1;
    account.openPositionCount += 1;
    account.save();

    //
    // update market position
    //
    market.positionCount += 1;
    market.openPositionCount += 1;

    if (eventType == EventType.DEPOSIT) {
      market.lendingPositionCount += 1;
    } else if (eventType == EventType.BORROW) {
      market.borrowingPositionCount += 1;
    }
    market.save();

    //
    // update protocol position
    //
    protocol.cumulativePositionCount += 1;
    protocol.openPositionCount += 1;
    if (eventType == EventType.DEPOSIT) {
      let depositorActorID = "depositor".concat("-").concat(account.id);
      let depositorActor = ActorAccount.load(depositorActorID);
      if (!depositorActor) {
        depositorActor = new ActorAccount(depositorActorID);
        depositorActor.save();

        protocol.cumulativeUniqueDepositors += 1;
        protocol.save();
      }
    } else if (eventType == EventType.BORROW) {
      let borrowerActorID = "borrower".concat("-").concat(account.id);
      let borrowerActor = ActorAccount.load(borrowerActorID);
      if (!borrowerActor) {
        borrowerActor = new ActorAccount(borrowerActorID);
        borrowerActor.save();

        protocol.cumulativeUniqueBorrowers += 1;
        protocol.save();
      }
    }
  }

  //
  // take position snapshot
  //
  snapshotPosition(position, event);

  return positionID;
}

// A series of side effects on position subtracted
// They include:
// * Close a position when needed or reuse the exisitng position
// * Update position related data in protocol, market, account
// * Take position snapshot
export function subtractPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  balanceResult: ethereum.CallResult<BigInt>,
  side: string,
  eventType: String,
  event: ethereum.Event,
): string | null {
  let counterID = account.id.concat("-").concat(market.id).concat("-").concat(side);
  let positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    log.warning("[subtractPosition] position counter {} not found", [counterID]);
    return null;
  }
  let positionID = positionCounter.id.concat("-").concat(positionCounter.nextCount.toString());
  let position = Position.load(positionID);
  if (!position) {
    log.warning("[subtractPosition] position {} not found", [positionID]);
    return null;
  }

  if (balanceResult.reverted) {
    log.warning("[subtractPosition] Fetch balance of {} from {} reverted", [account.id, market.id]);
  } else {
    position.balance = balanceResult.value;
  }
  if (eventType == EventType.WITHDRAW) {
    position.withdrawCount += 1;
  } else if (eventType == EventType.REPAY) {
    position.repayCount += 1;
  } else if (eventType == EventType.LIQUIDATEE) {
    position.liquidationCount += 1;
  }
  position.save();

  let closePosition = position.balance == BIGINT_ZERO;
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

///////////////////
///// Helpers /////
///////////////////

function snapshotPosition(position: Position, event: ethereum.Event): void {
  let snapshot = new PositionSnapshot(
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

export function createAccount(accountID: string): Account {
  let account = new Account(accountID);
  account.positionCount = 0;
  account.openPositionCount = 0;
  account.closedPositionCount = 0;
  account.depositCount = 0;
  account.withdrawCount = 0;
  account.borrowCount = 0;
  account.repayCount = 0;
  account.liquidateCount = 0;
  account.liquidationCount = 0;
  account.save();
  return account;
}

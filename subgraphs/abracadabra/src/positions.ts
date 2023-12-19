import { ethereum, BigInt, log, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveEventAccount,
  Market,
  Position,
  PositionSnapshot,
  PositionCounter,
  LendingProtocol,
  ActiveAccount,
} from "../generated/schema";
import { Cauldron } from "../generated/templates/Cauldron/Cauldron";
import {
  ActivityInterval,
  BIGINT_ZERO,
  EventType,
  InterestRateSide,
  PositionSide,
  SECONDS_PER_DAY,
} from "./common/constants";
import { getOrCreateActivityHelper } from "./common/getters";

export function getOrCreateAccount(
  accountId: Address,
  protocol: LendingProtocol
): Account {
  let account = Account.load(accountId);
  if (!account) {
    account = new Account(accountId);
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

    protocol.cumulativeUniqueUsers++;
    protocol.save();
  }
  return account;
}

export function addAccountToProtocol(
  eventType: string,
  account: Account,
  event: ethereum.Event,
  protocol: LendingProtocol
): void {
  const dailyId = event.block.timestamp.toI32() / SECONDS_PER_DAY;

  // get daily active account
  const activeEventId = Bytes.fromUTF8("daily")
    .concat(Bytes.fromUTF8("-"))
    .concat(account.id)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(dailyId))
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(eventType));
  let activeEvent = ActiveEventAccount.load(activeEventId);

  // get cumulative account by event type
  const activeAccountId = account.id
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(eventType));
  let activeAccount = ActiveAccount.load(activeAccountId);

  const activity = getOrCreateActivityHelper(
    Bytes.fromUTF8(ActivityInterval.DAILY)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromI32(dailyId))
  );

  if (eventType == EventType.DEPOSIT) {
    if (!activeAccount) {
      protocol.cumulativeUniqueDepositors++;
      activeAccount = new ActiveAccount(activeAccountId);
      activeAccount.save();
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      activeEvent.save();
      activity.activeDepositors += 1;
    }
  } else if (eventType == EventType.BORROW) {
    if (!activeAccount) {
      protocol.cumulativeUniqueBorrowers++;
      activeAccount = new ActiveAccount(activeAccountId);
      activeAccount.save();
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      activeEvent.save();
      activity.activeBorrowers += 1;
    }
  } else if (eventType == EventType.LIQUIDATOR) {
    if (!activeAccount) {
      protocol.cumulativeUniqueLiquidators++;
      activeAccount = new ActiveAccount(activeAccountId);
      activeAccount.save();
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      activeEvent.save();
      activity.activeLiquidators += 1;
    }
  } else if (eventType == EventType.LIQUIDATEE) {
    if (!activeAccount) {
      protocol.cumulativeUniqueLiquidatees++;
      activeAccount = new ActiveAccount(activeAccountId);
      activeAccount.save();
    }
    if (!activeEvent) {
      activeEvent = new ActiveEventAccount(activeEventId);
      activeEvent.save();
      activity.activeLiquidatees += 1;
    }
  }
  protocol.save();
  activity.save();
}

export function updatePositions(
  side: string,
  protocol: LendingProtocol,
  market: Market,
  eventType: string,
  account: Account,
  event: ethereum.Event,
  liquidation: boolean = false
): Bytes {
  if (
    eventType == EventType.DEPOSIT ||
    eventType == EventType.BORROW ||
    eventType == EventType.LIQUIDATOR ||
    eventType == EventType.LIQUIDATEE
  ) {
    log.warning("updatePositions: {}", [eventType]);
    addAccountToProtocol(eventType, account, event, protocol);
  }

  const balance = getAccountBalance(
    Address.fromBytes(market.id),
    Address.fromBytes(account.id),
    side
  );

  if (eventType == EventType.DEPOSIT || eventType == EventType.BORROW) {
    // add position
    return addPosition(
      protocol,
      market,
      account,
      balance,
      eventType,
      side,
      event
    ).id;
  } else {
    const position = subtractPosition(
      protocol,
      market,
      account,
      balance,
      side,
      eventType,
      event
    );
    if (!position) {
      return Bytes.empty();
    }
    if (liquidation) {
      position.liquidationCount += 1;
      position.save();
    }

    return position.id;
  }
}

// grab an individual accounts balances on a market
function getAccountBalance(
  marketAddress: Address,
  accountAddress: Address,
  positionSide: string
): BigInt {
  const cauldronContract = Cauldron.bind(marketAddress);

  let tryBalance: ethereum.CallResult<BigInt>;
  if (positionSide == InterestRateSide.BORROW) {
    // grab an accounts MIM borrow from a given collateral mkt
    tryBalance = cauldronContract.try_userBorrowPart(accountAddress);
  } else {
    // grab an accounts inputTokenBalance
    tryBalance = cauldronContract.try_userCollateralShare(accountAddress);
  }

  return tryBalance.reverted ? BIGINT_ZERO : tryBalance.value;
}

export function getLiquidatePosition(
  side: string,
  marketId: Address,
  accountId: Address
): Bytes {
  const positionCounter = PositionCounter.load(
    accountId
      .concat(Bytes.fromUTF8("-"))
      .concat(marketId)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromUTF8(side))
  );
  if (!positionCounter) {
    log.warning("No liquidation position found for account {} on market {}", [
      accountId.toHexString(),
      marketId.toHexString(),
    ]);
    return Bytes.empty();
  }

  const position = Position.load(
    positionCounter.id
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromI32(positionCounter.nextCount))
  );
  if (!position) {
    log.warning("No liquidation position found for account {} on market {}", [
      accountId.toHexString(),
      marketId.toHexString(),
    ]);
    return Bytes.empty();
  }

  return position.id;
}

// A series of side effects on position added
// They include:
// * Create a new position when needed or reuse the existing position
// * Update position related data in protocol, market, account
// * Take position snapshot
function addPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  newBalance: BigInt,
  eventType: string,
  side: string,
  event: ethereum.Event
): Position {
  const counterID = account.id
    .concat(Bytes.fromUTF8("-"))
    .concat(market.id)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(side));
  let positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new PositionCounter(counterID);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }
  const positionID = positionCounter.id
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(positionCounter.nextCount));

  let position = Position.load(positionID);
  const openPosition = position == null;
  if (!openPosition) {
    position = position!;
    position.balance = newBalance;
    if (eventType == EventType.DEPOSIT) {
      position.depositCount += 1;
      account.depositCount += 1;
    } else if (eventType == EventType.BORROW) {
      position.borrowCount += 1;
      account.borrowCount += 1;
    }
    account.save();
    position.save();

    snapshotPosition(position, event);
    return position;
  }

  // open a new position
  position = new Position(positionID);
  position.account = account.id;
  position.market = market.id;
  position.hashOpened = event.transaction.hash.toHexString();
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.side = side;
  if (side == PositionSide.LENDER) {
    position.isCollateral = market.canUseAsCollateral;
  }
  position.balance = newBalance;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.borrowCount = 0;
  position.repayCount = 0;
  position.liquidationCount = 0;
  if (eventType == EventType.DEPOSIT) {
    position.depositCount += 1;
    account.depositCount += 1;
  } else if (eventType == EventType.BORROW) {
    position.borrowCount += 1;
    account.borrowCount += 1;
  }
  position.save();

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
  protocol.save();

  //
  // take position snapshot
  //
  snapshotPosition(position, event);

  return position;
}

// A series of side effects on position subtracted
// They include:
// * Close a position when needed or reuse the exisitng position
// * Update position related data in protocol, market, account
// * Take position snapshot
function subtractPosition(
  protocol: LendingProtocol,
  market: Market,
  account: Account,
  newBalance: BigInt,
  side: string,
  eventType: string,
  event: ethereum.Event
): Position | null {
  const counterID = account.id
    .concat(Bytes.fromUTF8("-"))
    .concat(market.id)
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromUTF8(side));
  const positionCounter = PositionCounter.load(counterID);
  if (!positionCounter) {
    log.warning("[subtractPosition] position counter {} not found", [
      counterID.toHexString(),
    ]);
    return null;
  }
  const positionID = positionCounter.id
    .concat(Bytes.fromUTF8("-"))
    .concat(Bytes.fromI32(positionCounter.nextCount));
  const position = Position.load(positionID);
  if (!position) {
    log.warning("[subtractPosition] position {} not found", [
      positionID.toHexString(),
    ]);
    return null;
  }
  position.balance = newBalance;
  if (eventType == EventType.WITHDRAW) {
    position.withdrawCount += 1;
    account.withdrawCount += 1;
  } else if (eventType == EventType.REPAY) {
    position.repayCount += 1;
    account.repayCount += 1;
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

  return position;
}

function snapshotPosition(position: Position, event: ethereum.Event): void {
  const snapshot = new PositionSnapshot(
    position.id
      .concat(Bytes.fromUTF8("-"))
      .concat(event.transaction.hash)
      .concat(Bytes.fromUTF8("-"))
      .concat(Bytes.fromI32(event.logIndex.toI32()))
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

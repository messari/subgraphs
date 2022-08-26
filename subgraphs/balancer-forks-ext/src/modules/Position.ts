import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts";
import {
  Account,
  Deposit,
  LiquidityPool,
  Position,
  PositionSnapshot,
  UniqueAccount,
  Withdraw,
  _PositionCounter,
} from "../../generated/schema";

import * as constants from "../common/constants";
import {
  getOrCreateLiquidityPool,
  getOrCreateDexAmmProtocol,
} from "../common/initializers";
import { addToArrayAtIndex } from "../common/utils";

export function getOrCreateAccount(
  accountId: string,
  isTrader: boolean = false
): Account {
  let account = Account.load(accountId);
  let protocol = getOrCreateDexAmmProtocol();

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

  let uniqueAccountId = `${accountId}-LP`;
  if (isTrader) {
    uniqueAccountId = `${accountId}-TRADER`;
  }
  let uniqueAccount = UniqueAccount.load(uniqueAccountId);

  if (!uniqueAccount) {
    uniqueAccount = new UniqueAccount(uniqueAccountId);
    uniqueAccount.account = accountId;
    uniqueAccount.type = "LP";
    if (isTrader) {
      uniqueAccount.type = "TRADER";
      protocol.cumulativeUniqueTraders += 1;
    } else {
      protocol.cumulativeUniqueLPs += 1;
    }
    uniqueAccount.save();
  }

  protocol.save();

  return account;
}

export function getOrCreatePosition(
  poolId: string,
  accountId: string,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): Position {
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

  let pool = getOrCreateLiquidityPool(Address.fromString(poolId), block);

  pool.positionCount += 1;
  pool.openPositionCount += 1;
  pool.save();

  let protocol = getOrCreateDexAmmProtocol();
  protocol.openPositionCount += 1;
  protocol.cumulativePositionCount += 1;
  protocol.save();

  position.account = accountId;
  position.pool = poolId;
  position.hashOpened = transaction.hash.toHexString();
  position.blockNumberOpened = block.number;
  position.timestampOpened = block.timestamp;
  position.depositCount = 0;
  position.withdrawCount = 0;
  position.inputTokenBalances = [];
  position.outputTokenBalance = constants.BIGINT_ZERO;
  position.save();

  return position;
}

export function updatePositions(
  pool: LiquidityPool,
  eventType: string,
  accountId: Address,
  outputTokenAmount: BigInt,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  transactionLogIndex: BigInt
): void {
  //  position is the current open position or a newly create open position
  let account = getOrCreateAccount(accountId.toHexString());
  let position = getOrCreatePosition(pool.id, account.id, transaction, block);
  let closePositionToggle = false;

  if (eventType == constants.UsageType.DEPOSIT) {
    account.depositCount = account.depositCount + 1;
    position.depositCount = position.depositCount + 1;

    position.inputTokenBalances = [];

    position.outputTokenBalance =
      position.outputTokenBalance.plus(outputTokenAmount);
  } else if (eventType == constants.UsageType.WITHDRAW) {
    account.withdrawCount = account.depositCount + 1;
    position.withdrawCount = position.withdrawCount + 1;
    position.inputTokenBalances = [];

    position.outputTokenBalance =
      position.outputTokenBalance.minus(outputTokenAmount);

    if (position.outputTokenBalance.equals(constants.BIGINT_ZERO)) {
      closePositionToggle = true;
    }
  }

  position.save();
  account.save();
  takePositionSnapshot(position, transaction, block, transactionLogIndex);
  if (closePositionToggle) {
    closePosition(position, account, pool, transaction, block);
  }
}

export function takePositionSnapshot(
  position: Position,
  transaction: ethereum.Transaction,
  block: ethereum.Block,
  transactionLogIndex: BigInt
): void {
  let hash = transaction.hash.toHexString();
  let txLogIndex = transactionLogIndex.toI32();
  let snapshot = new PositionSnapshot(`${position.id}-${hash}-${txLogIndex}`);

  snapshot.position = position.id;
  snapshot.hash = hash;
  snapshot.logIndex = txLogIndex;
  snapshot.nonce = transaction.nonce;
  snapshot.inputTokenBalances = position.inputTokenBalances;
  snapshot.outputTokenBalance = position.outputTokenBalance;
  snapshot.cumulativeRewardTokenAmounts = position.cumulativeRewardTokenAmounts;

  snapshot.blockNumber = block.number;
  snapshot.timestamp = block.timestamp;

  snapshot.save();
}

export function closePosition(
  position: Position,
  account: Account,
  pool: LiquidityPool,
  transaction: ethereum.Transaction,
  block: ethereum.Block
): void {
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

  let protocol = getOrCreateDexAmmProtocol();
  protocol.openPositionCount -= 1;
  protocol.save();

  position.hashClosed = transaction.hash.toHexString();
  position.blockNumberClosed = block.number;
  position.timestampClosed = block.timestamp;
  position.save();
}

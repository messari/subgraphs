import {
  ethereum,
  Bytes,
  Address,
  BigDecimal,
  log,
} from "@graphprotocol/graph-ts";
import {
  Account,
  LiquidityPool,
  Position,
  PositionSnapshot,
  _PositionCounter,
} from "../../generated/schema";
import {
  decrementAccountOpenPositionCount,
  incrementAccountOpenPositionCount,
} from "./account";
import {
  decrementPoolOpenPositionCount,
  incrementPoolOpenPositionCount,
} from "./pool";
import { EventType } from "./event";
import { getOrCreateToken } from "./token";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
} from "../utils/constants";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../utils/numbers";

export function getUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string
): Position | null {
  const positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );
  return Position.load(positionId);
}

export function createUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string
): Position {
  const positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );
  const position = new Position(positionId);
  position.account = account.id;
  position.liquidityPool = pool.id;
  position.collateral = collateralTokenAddress;
  position.asset = indexTokenAddress;
  position.side = positionSide;

  position.fundingrateOpen = BIGDECIMAL_ZERO;
  const fundingTokenIndex = pool.inputTokens.indexOf(collateralTokenAddress);
  if (fundingTokenIndex >= 0) {
    position.fundingrateOpen = pool._fundingrate[fundingTokenIndex];
  }

  position.fundingrateClosed = BIGDECIMAL_ZERO;
  position.leverage = BIGDECIMAL_ZERO;
  position.balance = BIGINT_ZERO;
  position.collateralBalance = BIGINT_ZERO;
  position.balanceUSD = BIGDECIMAL_ZERO;
  position.collateralBalanceUSD = BIGDECIMAL_ZERO;
  position.collateralInCount = INT_ZERO;
  position.collateralOutCount = INT_ZERO;
  position._timestampClosed = BIGINT_ZERO;
  position.save();

  incrementAccountOpenPositionCount(account, positionSide);
  incrementPoolOpenPositionCount(event, pool, positionSide);

  return position;
}

export function getOrCreateUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string
): Position {
  const position = getUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );
  if (position) {
    return position;
  }

  return createUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );
}

export function updateUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  collateralTokenAmountUSD: BigDecimal,
  indexTokenAddress: Address,
  indexTokenAmountUSD: BigDecimal,
  positionSide: string,
  eventType: EventType
): Position {
  const position = getOrCreateUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );

  switch (eventType) {
    case EventType.CollateralIn:
      position.balanceUSD = position.balanceUSD.plus(indexTokenAmountUSD);
      position.collateralBalanceUSD = position.collateralBalanceUSD.plus(
        collateralTokenAmountUSD
      );
      position.collateralInCount += INT_ONE;

      break;
    case EventType.CollateralOut:
      position.balanceUSD = position.balanceUSD.minus(indexTokenAmountUSD);
      position.collateralBalanceUSD = position.collateralBalanceUSD.minus(
        collateralTokenAmountUSD
      );
      position.collateralOutCount += INT_ONE;
      validatePosition(event, account, pool, position);

      break;
    case EventType.Liquidated:
      closePosition(event, account, pool, position);

      break;

    default:
      break;
  }

  if (position.collateralBalanceUSD != BIGDECIMAL_ZERO) {
    position.leverage = position.balanceUSD.div(position.collateralBalanceUSD);
  }

  position.save();

  createPositionSnapshot(event, position);

  return position;
}

export function createPositionSnapshot(
  event: ethereum.Event,
  position: Position
): void {
  const id = position.id
    .concat(event.transaction.hash)
    .concatI32(event.transactionLogIndex.toI32());
  const snapshot = new PositionSnapshot(id);

  snapshot.account = position.account;
  snapshot.position = position.id;
  snapshot.fundingrate = position.fundingrateOpen;
  snapshot.balance = position.balance;
  snapshot.collateralBalance = position.collateralBalance;
  snapshot.balanceUSD = position.balanceUSD;
  snapshot.collateralBalanceUSD = position.collateralBalanceUSD;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

function validatePosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  position: Position
): void {
  if (position.balanceUSD.le(BIGDECIMAL_ZERO)) {
    if (position.balanceUSD.lt(BIGDECIMAL_ZERO)) {
      log.error("Negative balance in position {}, balanceUSD: {}", [
        position.id.toHexString(),
        position.balanceUSD.toString(),
      ]);
    }
    closePosition(event, account, pool, position);
    return;
  }

  // balanceUSD is more accurate data as it comes from event data, re-calcuate balance with balanceUSD in case there is problem with balance.
  if (position.balance < BIGINT_ZERO) {
    log.error("Negative balance in position {}, balance: {}", [
      position.id.toHexString(),
      position.balance.toString(),
    ]);
    position.balance = BIGINT_ZERO;
    const indexToken = getOrCreateToken(
      event,
      Address.fromBytes(position.asset)
    );
    if (indexToken.lastPriceUSD && indexToken.lastPriceUSD != BIGDECIMAL_ZERO) {
      position.balance = bigDecimalToBigInt(
        position.balanceUSD
          .times(exponentToBigDecimal(indexToken.decimals))
          .div(indexToken.lastPriceUSD!)
      );
    }
  }

  if (position.collateralBalance < BIGINT_ZERO) {
    position.collateralBalance = BIGINT_ZERO;
    const collateralToken = getOrCreateToken(
      event,
      Address.fromBytes(position.collateral)
    );
    if (
      collateralToken.lastPriceUSD &&
      collateralToken.lastPriceUSD != BIGDECIMAL_ZERO
    ) {
      position.collateralBalance = bigDecimalToBigInt(
        position.collateralBalanceUSD
          .times(exponentToBigDecimal(collateralToken.decimals))
          .div(collateralToken.lastPriceUSD!)
      );
    }
  }

  position.save();
}

function closePosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  position: Position
): void {
  const fundingTokenIndex = pool.inputTokens.indexOf(position.collateral);
  if (fundingTokenIndex >= 0) {
    position.fundingrateClosed = pool._fundingrate[fundingTokenIndex];
  }
  position.leverage = BIGDECIMAL_ZERO;
  position.balance = BIGINT_ZERO;
  position.balanceUSD = BIGDECIMAL_ZERO;
  position.collateralBalance = BIGINT_ZERO;
  position.collateralBalanceUSD = BIGDECIMAL_ZERO;
  position._timestampClosed = event.block.timestamp;
  position.save();

  const counterID = account.id
    .concat(pool.id)
    .concat(Bytes.fromUTF8(position.side))
    .concat(position.collateral)
    .concat(position.asset);
  const positionCounter = _PositionCounter.load(counterID);
  if (positionCounter) {
    positionCounter.nextCount += INT_ONE;
    positionCounter.save();
  }

  decrementAccountOpenPositionCount(account, position.side);
  decrementPoolOpenPositionCount(event, pool, position.side);
}

function getPositionID(
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string
): Bytes {
  const counterID = account.id
    .concat(pool.id)
    .concat(Bytes.fromUTF8(positionSide))
    .concat(collateralTokenAddress)
    .concat(indexTokenAddress);
  let positionCounter = _PositionCounter.load(counterID);
  if (!positionCounter) {
    positionCounter = new _PositionCounter(counterID);
    positionCounter.nextCount = 0;
    positionCounter.save();
  }

  return positionCounter.id.concatI32(positionCounter.nextCount);
}

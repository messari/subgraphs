import { ethereum, Bytes, Address, BigDecimal } from "@graphprotocol/graph-ts";
import {
  Account,
  LiquidityPool,
  Position,
  PositionSnapshot,
  _PositionCounter,
  _PositionMap,
} from "../../generated/schema";
import { Vault } from "../../generated/Vault/Vault";
import { NetworkConfigs } from "../../configurations/configure";
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
  PositionSide,
  PRICE_PRECISION,
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
  position.hashOpened = event.transaction.hash;
  position.blockNumberOpened = event.block.number;
  position.timestampOpened = event.block.timestamp;
  position.collateral = collateralTokenAddress;
  position.asset = indexTokenAddress;
  position.side = positionSide;

  position.fundingrateOpen = BIGDECIMAL_ZERO;
  const fundingTokenIndex = pool.inputTokens.indexOf(collateralTokenAddress);
  if (fundingTokenIndex >= 0) {
    position.fundingrateOpen = pool.fundingrate[fundingTokenIndex];
  }

  position.fundingrateClosed = BIGDECIMAL_ZERO;
  position.leverage = BIGDECIMAL_ZERO;
  position.balance = BIGINT_ZERO;
  position.collateralBalance = BIGINT_ZERO;
  position.balanceUSD = BIGDECIMAL_ZERO;
  position.collateralBalanceUSD = BIGDECIMAL_ZERO;
  position.collateralInCount = INT_ZERO;
  position.collateralOutCount = INT_ZERO;
  position.liquidationCount = INT_ZERO;
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
  positionKey: Bytes,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
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
      position.collateralInCount += INT_ONE;
      break;
    case EventType.CollateralOut:
      position.collateralOutCount += INT_ONE;
      break;
    case EventType.Liquidated:
      position.liquidationCount += INT_ONE;
      break;
    default:
      break;
  }

  let isLong = true;
  if (position.side == PositionSide.SHORT) {
    isLong = false;
  }

  const prevBalanceUSD = position.balanceUSD;
  const prevCollateralBalanceUSD = position.collateralBalanceUSD;
  const vaultContract = Vault.bind(
    Address.fromBytes(NetworkConfigs.getVaultAddress())
  );
  const tryGetPosition = vaultContract.try_getPosition(
    Address.fromBytes(account.id),
    collateralTokenAddress,
    indexTokenAddress,
    isLong
  );
  if (!tryGetPosition.reverted) {
    position.balanceUSD = tryGetPosition.value
      .getValue0()
      .div(PRICE_PRECISION)
      .toBigDecimal();
    position.collateralBalanceUSD = tryGetPosition.value
      .getValue1()
      .div(PRICE_PRECISION)
      .toBigDecimal();

    const indexToken = getOrCreateToken(event, indexTokenAddress);
    if (indexToken.lastPriceUSD && indexToken.lastPriceUSD! > BIGDECIMAL_ZERO) {
      position.balance = bigDecimalToBigInt(
        position.balanceUSD
          .times(exponentToBigDecimal(indexToken.decimals))
          .div(indexToken.lastPriceUSD!)
      );
    }
    const collateralToken = getOrCreateToken(event, collateralTokenAddress);
    if (
      collateralToken.lastPriceUSD &&
      collateralToken.lastPriceUSD! > BIGDECIMAL_ZERO
    ) {
      position.collateralBalance = bigDecimalToBigInt(
        position.collateralBalanceUSD
          .times(exponentToBigDecimal(collateralToken.decimals))
          .div(collateralToken.lastPriceUSD!)
      );
    }

    if (position.collateralBalanceUSD != BIGDECIMAL_ZERO) {
      position.leverage = position.balanceUSD.div(
        position.collateralBalanceUSD
      );
    }
  }

  position.save();

  if (position.balanceUSD == BIGDECIMAL_ZERO) {
    closePosition(
      event,
      account,
      pool,
      position,
      prevBalanceUSD,
      prevCollateralBalanceUSD
    );
  }

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
  snapshot.hash = event.transaction.hash;
  snapshot.logIndex = event.transactionLogIndex.toI32();
  snapshot.nonce = event.transaction.nonce;
  snapshot.position = position.id;
  snapshot.fundingrate = position.fundingrateOpen;
  snapshot.balance = position.balance;
  snapshot.collateralBalance = position.collateralBalance;
  snapshot.balanceUSD = position.balanceUSD;
  snapshot.collateralBalanceUSD = position.collateralBalanceUSD;
  snapshot.realisedPnlUSD = position.realisedPnlUSD;
  snapshot.blockNumber = event.block.number;
  snapshot.timestamp = event.block.timestamp;

  snapshot.save();
}

export function createPositionMap(
  positionKey: Bytes,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string
): _PositionMap {
  const positionMap = new _PositionMap(positionKey);
  positionMap.positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide
  );
  positionMap.save();

  return positionMap;
}

export function getPositionIdWithKey(positionKey: Bytes): Bytes | null {
  const positionMap = _PositionMap.load(positionKey);
  if (positionMap) {
    return positionMap.positionId;
  }

  return null;
}

export function updatePositionRealisedPnlUSD(
  positionKey: Bytes,
  realisedPnlUSD: BigDecimal
): void {
  const positionMap = _PositionMap.load(positionKey);
  if (!positionMap) {
    return;
  }

  const position = Position.load(positionMap.positionId);
  if (!position) {
    return;
  }

  position.realisedPnlUSD = realisedPnlUSD;
  position.save();
}

function closePosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  position: Position,
  prevBalanceUSD: BigDecimal,
  prevCollateralBalanceUSD: BigDecimal
): void {
  const fundingTokenIndex = pool.inputTokens.indexOf(position.collateral);
  if (fundingTokenIndex >= 0) {
    position.fundingrateClosed = pool.fundingrate[fundingTokenIndex];
  }
  position.leverage = BIGDECIMAL_ZERO;
  position.balance = BIGINT_ZERO;
  position.balanceUSD = BIGDECIMAL_ZERO;
  position.collateralBalance = BIGINT_ZERO;
  position.collateralBalanceUSD = BIGDECIMAL_ZERO;
  position.closeBalanceUSD = prevBalanceUSD;
  position.closeCollateralBalanceUSD = prevCollateralBalanceUSD;
  position.hashClosed = event.transaction.hash;
  position.blockNumberClosed = event.block.number;
  position.timestampClosed = event.block.timestamp;
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

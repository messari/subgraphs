import {
  ethereum,
  BigDecimal,
  BigInt,
  Bytes,
  Address,
} from "@graphprotocol/graph-ts";
import {
  Account,
  LiquidityPool,
  Position,
  PositionSnapshot,
  _PositionMap,
} from "../../generated/schema";
import { PositionVault } from "../../generated/VaultUtils/PositionVault";
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
  POSITION_VAULT_ADDRESS,
  PRICE_PRECISION,
} from "../utils/constants";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../utils/numbers";

export function getUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  posId: BigInt
): Position | null {
  const positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId
  );
  return Position.load(positionId);
}

export function createUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  posId: BigInt,
  entryFundingRate: BigDecimal
): Position {
  const positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId
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

  position.fundingrateOpen = entryFundingRate;
  position.fundingrateClosed = BIGDECIMAL_ZERO;
  position.leverage = BIGDECIMAL_ZERO;
  position.balance = BIGINT_ZERO;
  position.collateralBalance = BIGINT_ZERO;
  position.balanceUSD = BIGDECIMAL_ZERO;
  position.collateralBalanceUSD = BIGDECIMAL_ZERO;
  position.collateralInCount = INT_ZERO;
  position.collateralOutCount = INT_ZERO;
  position.liquidationCount = INT_ZERO;
  position._posId = posId;
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
  positionSide: string,
  posId: BigInt,
  entryFundingRate: BigDecimal
): Position {
  const position = getUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId
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
    positionSide,
    posId,
    entryFundingRate
  );
}

export function updateUserPosition(
  event: ethereum.Event,
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  posId: BigInt,
  entryFundingRate: BigDecimal,
  realisedPnl: BigInt,
  eventType: EventType
): Position {
  const position = getOrCreateUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId,
    entryFundingRate
  );

  const realisedPnlUSD = realisedPnl.div(PRICE_PRECISION).toBigDecimal();
  switch (eventType) {
    case EventType.CollateralIn:
      position.collateralInCount += INT_ONE;
      break;
    case EventType.CollateralOut:
    case EventType.ClosePosition:
      position.collateralOutCount += INT_ONE;
      position.realisedPnlUSD = realisedPnlUSD;
      break;
    case EventType.Liquidated:
      position.liquidationCount += INT_ONE;
      position.realisedPnlUSD = realisedPnlUSD;
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
  const positionVaultContract = PositionVault.bind(
    Address.fromString(POSITION_VAULT_ADDRESS)
  );
  const tryGetPosition = positionVaultContract.try_getPosition(
    Address.fromBytes(account.id),
    indexTokenAddress,
    isLong,
    posId
  );
  if (!tryGetPosition.reverted) {
    position.balanceUSD = tryGetPosition.value
      .getValue0()
      .size.div(PRICE_PRECISION)
      .toBigDecimal();
    position.collateralBalanceUSD = tryGetPosition.value
      .getValue0()
      .collateral.div(PRICE_PRECISION)
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

  if (
    eventType == EventType.ClosePosition ||
    eventType == EventType.Liquidated
  ) {
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
  snapshot.realisedPnlUSD = position.realisedPnlUSD;
  snapshot.balanceUSD = position.balanceUSD;
  snapshot.collateralBalanceUSD = position.collateralBalanceUSD;
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
  positionSide: string,
  posId: BigInt
): _PositionMap {
  const positionMap = new _PositionMap(positionKey);
  positionMap.positionId = getPositionID(
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId
  );
  positionMap.save();

  return positionMap;
}

export function getPositionWithKey(positionKey: Bytes): Position | null {
  const positionMap = _PositionMap.load(positionKey);
  if (!positionMap) {
    return null;
  }

  return Position.load(positionMap.positionId);
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

  decrementAccountOpenPositionCount(account, position.side);
  decrementPoolOpenPositionCount(event, pool, position.side);
}

function getPositionID(
  account: Account,
  pool: LiquidityPool,
  collateralTokenAddress: Address,
  indexTokenAddress: Address,
  positionSide: string,
  posId: BigInt
): Bytes {
  return account.id
    .concat(pool.id)
    .concat(Bytes.fromUTF8(positionSide))
    .concat(collateralTokenAddress)
    .concat(indexTokenAddress)
    .concat(Bytes.fromByteArray(Bytes.fromBigInt(posId)));
}

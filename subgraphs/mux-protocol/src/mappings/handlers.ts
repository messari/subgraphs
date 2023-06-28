import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, LiquidityPool, Token } from "../../generated/schema";
import {
  createBorrow,
  createCollateralIn,
  createCollateralOut,
  createLiquidate,
  EventType,
} from "../entities/event";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { getUserPosition, updateUserPosition } from "../entities/position";
import {
  updatePoolOpenInterestUSD,
  increasePoolVolume,
} from "../entities/pool";
import { updateTempUsageMetrics } from "../entities/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_NEGATIVE_ONE,
  INT_ONE,
  INT_ZERO,
  PositionSide,
  BIGDECIMAL_NEGONE,
} from "../utils/constants";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../utils/numbers";

export function handleUpdatePositionEvent(
  event: ethereum.Event,
  pool: LiquidityPool,
  account: Account,
  collateralToken: Token,
  collateralAmountDelta: BigInt,
  collateralUSDDelta: BigDecimal,
  positionCollateralBalance: BigInt,
  positionCollateralBalanceUSD: BigDecimal,
  indexToken: Token,
  sizeUSDDelta: BigDecimal,
  positionBalance: BigInt,
  positionBalanceUSD: BigDecimal,
  positionPnlUSD: BigDecimal | null,
  isLong: boolean,
  eventType: EventType,
  liqudateProfitUSD: BigDecimal
): void {
  const indexTokenAddress = Address.fromBytes(indexToken.id);
  const collateralTokenAddress = Address.fromBytes(collateralToken.id);
  const accountAddress = Address.fromBytes(account.id);
  increasePoolVolume(
    event,
    pool,
    sizeUSDDelta,
    collateralTokenAddress,
    collateralAmountDelta,
    collateralUSDDelta,
    eventType
  );

  let positionSide = PositionSide.SHORT;
  if (isLong) {
    positionSide = PositionSide.LONG;
  }
  let openPositionCount = INT_ZERO;
  if (eventType == EventType.CollateralIn) {
    const existingPosition = getUserPosition(
      account,
      pool,
      collateralTokenAddress,
      indexTokenAddress,
      positionSide
    );
    if (!existingPosition) {
      openPositionCount = INT_ONE;
    }
  }
  const position = updateUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    positionCollateralBalance,
    positionCollateralBalanceUSD,
    indexTokenAddress,
    positionBalance,
    positionBalanceUSD,
    positionPnlUSD,
    positionSide,
    eventType
  );
  if (!position.timestampClosed) {
    openPositionCount = INT_NEGATIVE_ONE;
  }

  switch (eventType) {
    case EventType.CollateralIn:
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, isLong);

      createCollateralIn(
        event,
        pool,
        accountAddress,
        collateralTokenAddress,
        collateralAmountDelta,
        collateralUSDDelta,
        BIGINT_ZERO,
        position
      );

      if (sizeUSDDelta > BIGDECIMAL_ZERO) {
        let indexTokenAmountDelta = BIGINT_ZERO;
        if (
          indexToken.lastPriceUSD &&
          indexToken.lastPriceUSD! > BIGDECIMAL_ZERO
        ) {
          indexTokenAmountDelta = bigDecimalToBigInt(
            sizeUSDDelta
              .times(exponentToBigDecimal(indexToken.decimals))
              .div(indexToken.lastPriceUSD!)
          );
        }
        createBorrow(
          event,
          pool,
          accountAddress,
          indexTokenAddress,
          indexTokenAmountDelta,
          sizeUSDDelta,
          position
        );
      }

      updateTempUsageMetrics(
        event,
        accountAddress,
        eventType,
        openPositionCount,
        positionSide
      );
      break;
    case EventType.CollateralOut:
      updatePoolOpenInterestUSD(
        event,
        pool,
        sizeUSDDelta.times(BIGDECIMAL_NEGONE),
        isLong
      );

      createCollateralOut(
        event,
        pool,
        accountAddress,
        collateralTokenAddress,
        collateralAmountDelta,
        collateralUSDDelta,
        BIGINT_ZERO,
        position
      );

      updateTempUsageMetrics(
        event,
        accountAddress,
        eventType,
        openPositionCount,
        positionSide
      );
      break;
    case EventType.Liquidated:
      updatePoolOpenInterestUSD(
        event,
        pool,
        sizeUSDDelta.times(BIGDECIMAL_NEGONE),
        isLong
      );

      createLiquidate(
        event,
        pool,
        indexTokenAddress,
        collateralAmountDelta,
        collateralUSDDelta,
        liqudateProfitUSD,
        event.transaction.from,
        accountAddress,
        position
      );

      const liquidatorAccount = getOrCreateAccount(
        event,
        pool,
        event.transaction.from
      );
      incrementAccountEventCount(
        event,
        pool,
        liquidatorAccount,
        EventType.Liquidate,
        BIGINT_ZERO
      );

      updateTempUsageMetrics(
        event,
        event.transaction.from,
        EventType.Liquidate,
        INT_ZERO,
        positionSide
      );
      updateTempUsageMetrics(
        event,
        accountAddress,
        EventType.Liquidated,
        INT_NEGATIVE_ONE,
        positionSide
      );
      break;

    default:
      break;
  }
}

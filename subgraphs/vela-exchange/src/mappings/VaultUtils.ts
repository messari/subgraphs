import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import {
  IncreasePosition,
  DecreasePosition,
  ClosePosition,
  LiquidatePosition,
} from "../../generated/VaultUtils/VaultUtils";
import {
  createBorrow,
  createCollateralIn,
  createCollateralOut,
  createLiquidate,
  EventType,
} from "../entities/event";
import { getOrCreateToken, updateTokenPrice } from "../entities/token";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import {
  createPositionMap,
  getPositionWithKey,
  getUserPosition,
  updateUserPosition,
} from "../entities/position";
import {
  increaseProtocolStakeSideRevenue,
  incrementProtocolEventCount,
} from "../entities/protocol";
import {
  getOrCreateLiquidityPool,
  increasePoolProtocolSideRevenue,
  increasePoolSupplySideRevenue,
  updatePoolOpenInterestUSD,
  increasePoolPremium,
  increasePoolVolume,
} from "../entities/pool";
import { takeSnapshots, updateTempUsageMetrics } from "../entities/snapshots";
import {
  BIGDECIMAL_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FUNDING_PRECISION,
  INT_NEGATIVE_ONE,
  INT_ONE,
  INT_ZERO,
  PositionSide,
  PRICE_PRECISION,
  PROTOCOL_SIDE_REVENUE_PERCENT,
  STAKE_SIDE_REVENUE_PERCENT,
  USDC_ADDRESS_ARBITRUM,
} from "../utils/constants";
import { bigDecimalToBigInt, exponentToBigDecimal } from "../utils/numbers";
import { LiquidityPool } from "../../generated/schema";

export function handleIncreasePosition(event: IncreasePosition): void {
  event.params.posData;
  handleUpdatePositionEvent(
    event,
    event.params.key,
    event.params.account,
    Address.fromString(USDC_ADDRESS_ARBITRUM),
    event.params.posData[0].div(PRICE_PRECISION).toBigDecimal(),
    event.params.indexToken,
    event.params.posData[1].div(PRICE_PRECISION).toBigDecimal(),
    event.params.posData[5],
    event.params.posData[6],
    event.params.isLong,
    event.params.posId,
    event.params.posData[3].divDecimal(FUNDING_PRECISION),
    BIGINT_ZERO,
    EventType.CollateralIn
  );
}

export function handleDecreasePosition(event: DecreasePosition): void {
  handleUpdatePositionEvent(
    event,
    event.params.key,
    event.params.account,
    Address.fromString(USDC_ADDRESS_ARBITRUM),
    event.params.posData[0].div(PRICE_PRECISION).toBigDecimal(),
    event.params.indexToken,
    event.params.posData[1].div(PRICE_PRECISION).toBigDecimal(),
    event.params.posData[5],
    event.params.posData[6],
    event.params.isLong,
    event.params.posId,
    event.params.posData[3].divDecimal(FUNDING_PRECISION),
    event.params.realisedPnl,
    EventType.CollateralOut
  );
}

export function handleClosePosition(event: ClosePosition): void {
  const position = getPositionWithKey(event.params.key);
  if (!position) {
    return;
  }

  let isLong = true;
  if (position.side == PositionSide.SHORT) {
    isLong = false;
  }
  handleUpdatePositionEvent(
    event,
    event.params.key,
    Address.fromBytes(position.account),
    Address.fromString(USDC_ADDRESS_ARBITRUM),
    position.collateralBalanceUSD,
    Address.fromBytes(position.asset),
    position.balanceUSD,
    event.params.markPrice,
    event.params.feeUsd,
    isLong,
    position._posId!,
    BIGDECIMAL_ZERO,
    event.params.realisedPnl,
    EventType.ClosePosition
  );
}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  const position = getPositionWithKey(event.params.key);
  if (!position) {
    return;
  }

  let isLong = true;
  if (position.side == PositionSide.SHORT) {
    isLong = false;
  }
  handleUpdatePositionEvent(
    event,
    event.params.key,
    Address.fromBytes(position.account),
    Address.fromString(USDC_ADDRESS_ARBITRUM),
    position.collateralBalanceUSD,
    Address.fromBytes(position.asset),
    position.balanceUSD,
    event.params.markPrice,
    BIGINT_ZERO,
    isLong,
    position._posId!,
    BIGDECIMAL_ZERO,
    event.params.realisedPnl,
    EventType.Liquidated
  );
}

export function handleUpdatePositionEvent(
  event: ethereum.Event,
  positionKey: Bytes,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralUSDDelta: BigDecimal,
  indexTokenAddress: Address,
  sizeUSDDelta: BigDecimal,
  indexTokenPrice: BigInt,
  fee: BigInt,
  isLong: boolean,
  posId: BigInt,
  entryFundingRate: BigDecimal,
  realisedPnl: BigInt,
  eventType: EventType
): void {
  takeSnapshots(event);

  const account = getOrCreateAccount(event, accountAddress);
  incrementAccountEventCount(event, account, eventType, sizeUSDDelta);
  incrementProtocolEventCount(event, eventType, sizeUSDDelta);

  const indexToken = getOrCreateToken(event, indexTokenAddress);
  updateTokenPrice(
    event,
    indexToken,
    indexTokenPrice.div(PRICE_PRECISION).toBigDecimal()
  );
  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  let collateralTokenAmountDelta = BIGINT_ZERO;
  if (
    collateralToken.lastPriceUSD &&
    collateralToken.lastPriceUSD! > BIGDECIMAL_ZERO
  ) {
    collateralTokenAmountDelta = bigDecimalToBigInt(
      collateralUSDDelta
        .times(exponentToBigDecimal(collateralToken.decimals))
        .div(collateralToken.lastPriceUSD!)
    );
  }

  const pool = getOrCreateLiquidityPool(event);
  let positionSide = PositionSide.SHORT;
  if (isLong) {
    positionSide = PositionSide.LONG;
  }
  let OpenPositionCount = INT_ZERO;
  if (eventType == EventType.CollateralIn) {
    const existingPosition = getUserPosition(
      event,
      account,
      pool,
      collateralTokenAddress,
      indexTokenAddress,
      positionSide,
      posId
    );
    if (!existingPosition) {
      OpenPositionCount = INT_ONE;
      createPositionMap(
        positionKey,
        account,
        pool,
        collateralTokenAddress,
        indexTokenAddress,
        positionSide,
        posId
      );
    }
  } else if (
    eventType == EventType.ClosePosition ||
    eventType == EventType.Liquidated
  ) {
    OpenPositionCount = INT_NEGATIVE_ONE;
  }
  const position = updateUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    posId,
    entryFundingRate,
    realisedPnl,
    eventType
  );

  increasePoolPremium(
    event,
    pool,
    fee.div(PRICE_PRECISION).toBigDecimal(),
    eventType
  );

  increasePoolVolume(
    event,
    pool,
    sizeUSDDelta,
    collateralTokenAddress,
    collateralTokenAmountDelta,
    collateralUSDDelta,
    eventType
  );

  increaseCollectedFees(event, pool, fee);

  switch (eventType) {
    case EventType.CollateralIn:
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, true, isLong);

      createCollateralIn(
        event,
        accountAddress,
        collateralTokenAddress,
        collateralTokenAmountDelta,
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
        OpenPositionCount,
        positionSide
      );
      break;
    case EventType.CollateralOut:
    case EventType.ClosePosition:
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, false, isLong);

      createCollateralOut(
        event,
        accountAddress,
        collateralTokenAddress,
        collateralTokenAmountDelta,
        collateralUSDDelta,
        BIGINT_ZERO,
        position
      );

      updateTempUsageMetrics(
        event,
        accountAddress,
        eventType,
        OpenPositionCount,
        positionSide
      );
      break;
    case EventType.Liquidated:
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, false, isLong);

      createLiquidate(
        event,
        indexTokenAddress,
        collateralTokenAmountDelta,
        collateralUSDDelta,
        realisedPnl.div(PRICE_PRECISION).toBigDecimal(),
        event.transaction.from,
        accountAddress,
        position
      );

      const liquidatorAccount = getOrCreateAccount(
        event,
        event.transaction.from
      );
      incrementAccountEventCount(
        event,
        liquidatorAccount,
        EventType.Liquidate,
        BIGDECIMAL_ZERO
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

function increaseCollectedFees(
  event: ethereum.Event,
  pool: LiquidityPool,
  feeUsd: BigInt
): void {
  const totalFee = feeUsd.div(PRICE_PRECISION).toBigDecimal();

  // log.error("IincreasePoolProtocolSideRevenue {}", [
  //   totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT).toString(),
  // ]);

  increasePoolProtocolSideRevenue(
    event,
    pool,
    totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT)
  );
  increaseProtocolStakeSideRevenue(
    event,
    totalFee.times(STAKE_SIDE_REVENUE_PERCENT)
  );
  increasePoolSupplySideRevenue(
    event,
    pool,
    totalFee.times(
      BIGDECIMAL_ONE.minus(PROTOCOL_SIDE_REVENUE_PERCENT).minus(
        STAKE_SIDE_REVENUE_PERCENT
      )
    )
  );
}

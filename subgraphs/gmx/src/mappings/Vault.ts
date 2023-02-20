import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  Swap,
  IncreasePoolAmount,
  DecreasePoolAmount,
  IncreasePosition,
  DecreasePosition,
  CollectSwapFees,
  CollectMarginFees,
  ClosePosition,
  LiquidatePosition,
  UpdateFundingRate,
} from "../../generated/Vault/Vault";
import {
  createBorrow,
  createCollateralIn,
  createCollateralOut,
  createLiquidate,
  createSwap,
  EventType,
} from "../entities/event";
import { getOrCreateToken, updateTokenPrice } from "../entities/token";
import {
  getOrCreateAccount,
  incrementAccountEventCount,
} from "../entities/account";
import { getUserPosition, updateUserPosition } from "../entities/position";
import {
  increaseProtocolStakeSideRevenue,
  incrementProtocolEventCount,
} from "../entities/protocol";
import {
  getOrCreateLiquidityPool,
  increasePoolTotalRevenue,
  increasePoolProtocolSideRevenue,
  increasePoolSupplySideRevenue,
  updatePoolOpenInterestUSD,
  increasePoolPremium,
  increasePoolVolume,
  updatePoolInputTokenBalance,
  updatePoolFundingRate,
} from "../entities/pool";
import { takeSnapshots, updateTempUsageMetrics } from "../entities/snapshots";
import {
  BIGDECIMAL_ZERO,
  BIGINT_NEGONE,
  BIGINT_ZERO,
  FUNDING_PRECISION,
  INT_NEGATIVE_ONE,
  INT_ONE,
  INT_ZERO,
  PositionSide,
  PRICE_PRECISION,
  PROTOCOL_SIDE_REVENUE_PERCENT,
} from "../utils/constants";
import {
  bigDecimalToBigInt,
  convertTokenToDecimal,
  exponentToBigDecimal,
} from "../utils/numbers";

export function handleUpdateFundingRate(event: UpdateFundingRate): void {
  takeSnapshots(event);

  const token = getOrCreateToken(event, event.params.token);
  updatePoolFundingRate(
    event,
    token,
    event.params.fundingRate.divDecimal(FUNDING_PRECISION)
  );
}

// Handle a swap event emitted from a vault contract.
export function handleSwap(event: Swap): void {
  takeSnapshots(event);

  const account = getOrCreateAccount(event, event.params.account);
  incrementAccountEventCount(event, account, EventType.Swap, BIGINT_ZERO);
  incrementProtocolEventCount(event, EventType.Swap, BIGINT_ZERO);

  const inputToken = getOrCreateToken(event, event.params.tokenIn);
  const inputTokenAmountUSD = convertTokenToDecimal(
    event.params.amountIn,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);

  const outputToken = getOrCreateToken(event, event.params.tokenOut);
  const outputTokenAmountUSD = convertTokenToDecimal(
    event.params.amountOutAfterFees,
    outputToken.decimals
  ).times(outputToken.lastPriceUSD!);

  createSwap(
    event,
    event.params.account,
    event.params.tokenIn,
    event.params.amountIn,
    inputTokenAmountUSD,
    event.params.tokenOut,
    event.params.amountOutAfterFees,
    outputTokenAmountUSD
  );

  updateTempUsageMetrics(
    event,
    event.params.account,
    EventType.Swap,
    INT_ZERO,
    null
  );
}

export function handleIncreasePosition(event: IncreasePosition): void {
  handleUpdatePositionEvent(
    event,
    event.params.account,
    event.params.collateralToken,
    event.params.collateralDelta,
    event.params.indexToken,
    event.params.sizeDelta,
    event.params.price,
    event.params.fee,
    event.params.isLong,
    EventType.CollateralIn,
    BIGINT_ZERO
  );
}

export function handleDecreasePosition(event: DecreasePosition): void {
  handleUpdatePositionEvent(
    event,
    event.params.account,
    event.params.collateralToken,
    event.params.collateralDelta,
    event.params.indexToken,
    event.params.sizeDelta,
    event.params.price,
    event.params.fee,
    event.params.isLong,
    EventType.CollateralOut,
    BIGINT_ZERO
  );
}

export function handleLiquidatePosition(event: LiquidatePosition): void {
  handleUpdatePositionEvent(
    event,
    event.params.account,
    event.params.collateralToken,
    event.params.collateral,
    event.params.indexToken,
    event.params.size,
    event.params.markPrice,
    BIGINT_ZERO,
    event.params.isLong,
    EventType.Liquidated,
    event.params.realisedPnl
  );
}

export function handleUpdatePositionEvent(
  event: ethereum.Event,
  accountAddress: Address,
  collateralTokenAddress: Address,
  collateralDelta: BigInt,
  indexTokenAddress: Address,
  sizeDelta: BigInt,
  indexTokenPrice: BigInt,
  fee: BigInt,
  isLong: boolean,
  eventType: EventType,
  liqudateProfit: BigInt
): void {
  takeSnapshots(event);

  const account = getOrCreateAccount(event, accountAddress);
  incrementAccountEventCount(event, account, eventType, sizeDelta);
  incrementProtocolEventCount(event, eventType, sizeDelta);

  const indexToken = getOrCreateToken(event, indexTokenAddress);
  updateTokenPrice(
    event,
    indexToken,
    indexTokenPrice.div(PRICE_PRECISION).toBigDecimal()
  );
  const sizeUSDDelta = sizeDelta.div(PRICE_PRECISION).toBigDecimal();
  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  const collateralUSDDelta = collateralDelta
    .div(PRICE_PRECISION)
    .toBigDecimal();
  let collateralTokenAmountDelta = BIGINT_ZERO;
  if (
    collateralToken.lastPriceUSD &&
    collateralToken.lastPriceUSD != BIGDECIMAL_ZERO
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
      positionSide
    );
    if (!existingPosition) {
      OpenPositionCount = INT_ONE;
    }
  }
  const position = updateUserPosition(
    event,
    account,
    pool,
    collateralTokenAddress,
    indexTokenAddress,
    positionSide,
    eventType
  );
  if (!position.timestampClosed) {
    OpenPositionCount = INT_NEGATIVE_ONE;
  }

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

  switch (eventType) {
    case EventType.CollateralIn:
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, true);

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
          indexToken.lastPriceUSD != BIGDECIMAL_ZERO
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
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, false);

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
      updatePoolOpenInterestUSD(event, pool, sizeUSDDelta, false);

      createLiquidate(
        event,
        indexTokenAddress,
        collateralTokenAmountDelta,
        collateralUSDDelta,
        liqudateProfit.div(PRICE_PRECISION).toBigDecimal(),
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

export function handleClosePosition(event: ClosePosition): void {
  if (event.params.realisedPnl >= BIGINT_ZERO) {
    return;
  }
  takeSnapshots(event);

  const pool = getOrCreateLiquidityPool(event);
  increasePoolVolume(
    event,
    pool,
    BIGDECIMAL_ZERO,
    null,
    BIGINT_ZERO,
    BIGINT_NEGONE.times(event.params.realisedPnl)
      .div(PRICE_PRECISION)
      .toBigDecimal(),
    EventType.ClosePosition
  );
}

export function handleCollectSwapFees(event: CollectSwapFees): void {
  handleCollectFees(event, event.params.feeUsd);
}

export function handleCollectMarginFees(event: CollectMarginFees): void {
  handleCollectFees(event, event.params.feeUsd);
}

export function handleIncreasePoolAmount(event: IncreasePoolAmount): void {
  handleChangePoolAmount(event.params.token, event.params.amount, event, true);
}

export function handleDecreasePoolAmount(event: DecreasePoolAmount): void {
  handleChangePoolAmount(event.params.token, event.params.amount, event, false);
}

function handleChangePoolAmount(
  token: Address,
  amount: BigInt,
  event: ethereum.Event,
  isIncreasePoolAmount: boolean
): void {
  takeSnapshots(event);

  const inputToken = getOrCreateToken(event, token);
  updatePoolInputTokenBalance(event, inputToken, amount, isIncreasePoolAmount);
}

function handleCollectFees(event: ethereum.Event, feeUsd: BigInt): void {
  takeSnapshots(event);

  const totalFee = feeUsd.div(PRICE_PRECISION).toBigDecimal();

  increasePoolTotalRevenue(event, totalFee);
  increasePoolProtocolSideRevenue(
    event,
    totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT)
  );
  increasePoolSupplySideRevenue(
    event,
    totalFee.minus(totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT))
  );
  increaseProtocolStakeSideRevenue(
    event,
    totalFee.minus(totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT))
  );
}

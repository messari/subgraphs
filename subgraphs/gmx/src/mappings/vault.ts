import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
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
import {
  createPositionMap,
  getUserPosition,
  updatePositionRealisedPnlUSD,
  updateUserPosition,
} from "../entities/position";
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
  BIGDECIMAL_ONE,
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
  STAKE_SIDE_REVENUE_PERCENT,
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
    event.params.key,
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
    event.params.key,
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
    event.params.key,
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
  positionKey: Bytes,
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
    convertPriceToBigDecimal(indexTokenPrice)
  );
  const sizeUSDDelta = convertPriceToBigDecimal(sizeDelta);
  const collateralToken = getOrCreateToken(event, collateralTokenAddress);
  const collateralUSDDelta = convertPriceToBigDecimal(collateralDelta);
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
      account,
      pool,
      collateralTokenAddress,
      indexTokenAddress,
      positionSide
    );
    if (!existingPosition) {
      OpenPositionCount = INT_ONE;
      createPositionMap(
        positionKey,
        account,
        pool,
        collateralTokenAddress,
        indexTokenAddress,
        positionSide
      );
    }
  }
  const position = updateUserPosition(
    event,
    positionKey,
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

  increasePoolPremium(event, pool, convertPriceToBigDecimal(fee), eventType);

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
        convertPriceToBigDecimal(liqudateProfit),
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
  takeSnapshots(event);
  const realisedPnlUSD = convertPriceToBigDecimal(event.params.realisedPnl);
  updatePositionRealisedPnlUSD(event.params.key, realisedPnlUSD);

  if (event.params.realisedPnl < BIGINT_ZERO) {
    const pool = getOrCreateLiquidityPool(event);
    increasePoolVolume(
      event,
      pool,
      BIGDECIMAL_ZERO,
      null,
      BIGINT_ZERO,
      BIGINT_NEGONE.toBigDecimal().times(realisedPnlUSD),
      EventType.ClosePosition
    );
  }
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

  const totalFee = convertPriceToBigDecimal(feeUsd);

  increasePoolTotalRevenue(event, totalFee);
  increasePoolProtocolSideRevenue(
    event,
    totalFee.times(PROTOCOL_SIDE_REVENUE_PERCENT)
  );
  // For GMX, 30% of trade fees goes to stakers of native token (e.g. GMX stakers)
  increaseProtocolStakeSideRevenue(
    event,
    totalFee.times(STAKE_SIDE_REVENUE_PERCENT)
  );
  increasePoolSupplySideRevenue(
    event,
    totalFee.times(
      BIGDECIMAL_ONE.minus(PROTOCOL_SIDE_REVENUE_PERCENT).minus(
        STAKE_SIDE_REVENUE_PERCENT
      )
    )
  );
}

// Converts BigInt prices to BigDecimal for GMX using PRICE_PRECISION
export function convertPriceToBigDecimal(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(PRICE_PRECISION);
}

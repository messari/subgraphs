import {
  updatePosition,
  updatePositionRealisedPnlUSD,
} from "../modules/position";
import {
  ClosePosition as ClosePositionEvent,
  CollectMarginFees as CollectMarginFeesEvent,
  CollectSwapFees as CollectSwapFeesEvent,
  DecreasePoolAmount as DecreasePoolAmountEvent,
  DecreasePosition as DecreasePositionEvent,
  IncreasePoolAmount as IncreasePoolAmountEvent,
  IncreasePosition as IncreasePositionEvent,
  LiquidatePosition as LiquidatePositionEvent,
  Swap as SwapEvent,
  UpdateFundingRate as UpdateFundingRateEvent,
} from "../../generated/Vault/Vault";
import { swap } from "../modules/swap";
import * as utils from "../common/utils";
import { collectFees } from "../modules/fees";
import * as constants from "../common/constants";
import { increasePoolVolume } from "../modules/volume";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function handleClosePosition(event: ClosePositionEvent): void {
  const sdk = initializeSDK(event);
  const realisedPnlUSD = utils.bigIntToBigDecimal(
    event.params.realisedPnl,
    constants.PRICE_PRECISION_DECIMALS
  );
  const pool = getOrCreatePool(sdk);
  updatePositionRealisedPnlUSD(event.params.key, realisedPnlUSD, pool, sdk);
  if (event.params.realisedPnl < constants.BIGINT_ZERO) {
    increasePoolVolume(
      pool,

      constants.NULL.TYPE_ADDRESS,
      constants.BIGINT_ZERO,
      TransactionType.LIQUIDATE,
      sdk
    );
  }
}

export function handleCollectMarginFees(event: CollectMarginFeesEvent): void {
  collectFees(event, event.params.feeUsd);
}

export function handleCollectSwapFees(event: CollectSwapFeesEvent): void {
  collectFees(event, event.params.feeUsd);
}

export function handleIncreasePoolAmount(event: IncreasePoolAmountEvent): void {
  const amount = event.params.amount;
  const tokenAddress = event.params.token;

  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);

  utils.checkAndUpdateInputTokens(pool, token, amount);
  const inputTokens = pool.getInputTokens();
  const inputTokenIndex = inputTokens.indexOf(token.id);
  const inputTokenBalances = pool.pool.inputTokenBalances;
  inputTokenBalances[inputTokenIndex] =
    inputTokenBalances[inputTokenIndex].plus(amount);
  pool.setInputTokenBalances(inputTokenBalances, true);
}

export function handleDecreasePoolAmount(event: DecreasePoolAmountEvent): void {
  const amount = event.params.amount;
  const tokenAddress = event.params.token;
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  utils.checkAndUpdateInputTokens(pool, token, amount);
  const inputTokens = pool.getInputTokens();
  const inputTokenIndex = inputTokens.indexOf(token.id);
  const inputTokenBalances = pool.pool.inputTokenBalances;
  inputTokenBalances[inputTokenIndex] =
    inputTokenBalances[inputTokenIndex].minus(amount);
  pool.setInputTokenBalances(inputTokenBalances, true);
}

export function handleDecreasePosition(event: DecreasePositionEvent): void {
  updatePosition(
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
    TransactionType.COLLATERAL_OUT,
    constants.BIGINT_ZERO
  );
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
  updatePosition(
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
    TransactionType.COLLATERAL_IN,
    constants.BIGINT_ZERO
  );
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  updatePosition(
    event,
    event.params.key,
    event.params.account,
    event.params.collateralToken,
    event.params.collateral,
    event.params.indexToken,
    event.params.size,
    event.params.markPrice,
    constants.BIGINT_ZERO,
    event.params.isLong,
    TransactionType.LIQUIDATE,
    event.params.realisedPnl
  );
}

export function handleSwap(event: SwapEvent): void {
  swap(
    event,
    event.params.account,
    event.params.tokenIn,
    event.params.amountIn,
    event.params.tokenOut,
    event.params.amountOutAfterFees
  );
}

export function handleUpdateFundingRate(event: UpdateFundingRateEvent): void {
  const tokenAddress = event.params.token;
  const fundingrate = event.params.fundingRate;
  const sdk = initializeSDK(event);
  // const pool = getOrCreatePool(sdk);

  // const token = sdk.Tokens.getOrCreateToken(tokenAddress);

  // const inputTokens = pool.getInputTokens();
  // const fundingTokenIndex = inputTokens.indexOf(token.id);
  // const fundingrates = pool.pool.fundingrate;
  // if (fundingTokenIndex >= 0) {
  //   fundingrates[fundingTokenIndex] = utils.bigIntToBigDecimal(
  //     fundingrate,
  //     constants.FUNDING_PRECISION_DECIMALS
  //   );
  // }
  // pool.setFundingRate(fundingrates);
}

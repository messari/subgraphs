import {
  updatePosition,
  updatePositionRealisedPnlUSD,
} from "../modules/position";
import {
  Swap as SwapEvent,
  ClosePosition as ClosePositionEvent,
  CollectSwapFees as CollectSwapFeesEvent,
  IncreasePosition as IncreasePositionEvent,
  DecreasePosition as DecreasePositionEvent,
  CollectMarginFees as CollectMarginFeesEvent,
  LiquidatePosition as LiquidatePositionEvent,
  DecreasePoolAmount as DecreasePoolAmountEvent,
  IncreasePoolAmount as IncreasePoolAmountEvent,
  UpdateFundingRate,
} from "../../generated/Vault/Vault";
import { swap } from "../modules/swap";
import * as utils from "../common/utils";
import { collectFees } from "../modules/fees";
import { Bytes } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { updatePoolAmount } from "../modules/amount";
import { increasePoolVolume } from "../modules/volume";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { getOrCreatePool, initializeSDK } from "../common/initializers";
import { LiquidityPool as PoolSchema } from "../../generated/schema";

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
      constants.BIGDECIMAL_ZERO,
      constants.NULL.TYPE_ADDRESS,
      constants.BIGINT_ZERO,
      TransactionType.LIQUIDATE,
      constants.BIGINT_NEGONE.toBigDecimal().times(realisedPnlUSD),
      true,
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
  updatePoolAmount(event.params.amount, true, event.params.token, event);
}

export function handleDecreasePoolAmount(event: DecreasePoolAmountEvent): void {
  updatePoolAmount(event.params.amount, false, event.params.token, event);
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

export function handleUpdateFundingRate(event: UpdateFundingRate): void {
  const tokenAddress = event.params.token;
  const fundingrate = event.params.fundingRate;
  const pool = PoolSchema.load(
    Bytes.fromHexString(constants.VAULT_ADDRESS.toHexString())
  );
  if (!pool) return;

  const inputTokens = pool.inputTokens;
  const fundingTokenIndex = inputTokens.indexOf(
    Bytes.fromHexString(tokenAddress.toHexString())
  );
  const fundingrates = pool.fundingrate;
  if (fundingTokenIndex >= 0) {
    fundingrates[fundingTokenIndex] = utils.bigIntToBigDecimal(
      fundingrate,
      constants.FUNDING_PRECISION_DECIMALS
    );
  }
  pool.fundingrate = fundingrates;
  pool.save();
}

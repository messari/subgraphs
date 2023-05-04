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
import * as utils from "../common/utils";
import * as constants from "../common/constants";
import {
  getOrCreateAccount,
  getOrCreatePool,
  initializeSDK,
} from "../common/initializers";
import { Address } from "@graphprotocol/graph-ts";
import { handleUpdatePositionEvent } from "../modules/position";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";

export function handleClosePosition(event: ClosePositionEvent): void {
  //  const realisedPnlUSD = utils.bigIntToBigDecimal(event.params.realisedPnl,constants.PRICE_PRECISION_DECIMALS);
  //   updatePositionRealisedPnlUSD(event.params.key, realisedPnlUSD);
  //  if (event.params.realisedPnl < constants.BIGINT_ZERO) {
  //    const pool = getOrCreatePool(event);
  //    increasePoolVolume(
  //      event,
  //      pool,
  //      constants.BIGDECIMAL_ZERO,
  //      null,
  //      BIGINT_ZERO,
  //      BIGINT_NEGONE.toBigDecimal().times(realisedPnlUSD),
  //      EventType.ClosePosition
  //    );
  //  }
}

export function handleCollectMarginFees(event: CollectMarginFeesEvent): void {
  const feeUsd = event.params.feeUsd;
  const sdk = initializeSDK(event);
  const totalFee = utils.bigIntToBigDecimal(
    feeUsd,
    constants.PRICE_PRECISION_DECIMALS
  );
  const pool = getOrCreatePool(event, sdk);
  pool.addRevenueUSD(
    totalFee.times(constants.PROTOCOL_SIDE_REVENUE_PERCENT),
    totalFee.times(
      constants.BIGDECIMAL_ONE.minus(
        constants.PROTOCOL_SIDE_REVENUE_PERCENT
      ).minus(constants.STAKE_SIDE_REVENUE_PERCENT)
    )
  );
  sdk.Protocol.addStakeSideRevenueUSD(
    totalFee.times(constants.STAKE_SIDE_REVENUE_PERCENT)
  );
}

export function handleCollectSwapFees(event: CollectSwapFeesEvent): void {
  const feeUsd = event.params.feeUsd;
  const sdk = initializeSDK(event);
  const totalFee = utils.bigIntToBigDecimal(
    feeUsd,
    constants.PRICE_PRECISION_DECIMALS
  );
  const pool = getOrCreatePool(event, sdk);
  pool.addRevenueUSD(
    totalFee.times(constants.PROTOCOL_SIDE_REVENUE_PERCENT),
    totalFee.times(
      constants.BIGDECIMAL_ONE.minus(
        constants.PROTOCOL_SIDE_REVENUE_PERCENT
      ).minus(constants.STAKE_SIDE_REVENUE_PERCENT)
    )
  );
  sdk.Protocol.addStakeSideRevenueUSD(
    totalFee.times(constants.STAKE_SIDE_REVENUE_PERCENT)
  );
}

export function handleIncreasePoolAmount(event: IncreasePoolAmountEvent): void {
  const amount = event.params.amount;
  const tokenAddress = event.params.token;
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event, sdk);
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

  const pool = getOrCreatePool(event, sdk);
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
    TransactionType.COLLATERAL_OUT,
    constants.BIGINT_ZERO
  );
}

export function handleIncreasePosition(event: IncreasePositionEvent): void {
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
    TransactionType.COLLATERAL_IN,
    constants.BIGINT_ZERO
  );
}

export function handleLiquidatePosition(event: LiquidatePositionEvent): void {
  handleUpdatePositionEvent(
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
  const tokenInAddress = event.params.tokenIn;
  const tokenOutAddress = event.params.tokenOut;
  const amountIn = event.params.amountIn;
  const amountOut = event.params.amountOutAfterFees;
  const accountAddres = event.params.account;
  const sdk = initializeSDK(event);

  const pool = getOrCreatePool(event, sdk);
  const account = getOrCreateAccount(accountAddres, pool, sdk);

  account.swap(
    pool,
    tokenInAddress,
    amountIn,
    tokenOutAddress,
    amountOut,
    Address.fromBytes(pool.getBytesID()),
    true
  );
}

export function handleUpdateFundingRate(event: UpdateFundingRateEvent): void {
  // const tokenAddress = event.params.token;
  // const fundingrate = event.params.fundingRate;
  // const sdk = initializeSDK(event);
  // const pool = getOrCreatePool(event, sdk);
  // const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  // utils.checkAndUpdateInputTokens(pool, token);
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

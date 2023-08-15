import {
  DecreasePosition,
  DecreasePosition1 as DecreasePositionWithoutSignedPnl,
  IncreasePosition,
  LiquidatePosition,
  LiquidatePosition2 as LiquidatePositionWithoutSignedPnl,
  LiquidityAdded,
  LiquidityRemoved,
  Swap,
  Swap2 as SwapWithPrices,
  TokenDelisted,
  TokenWhitelisted,
} from "../../generated/Pool/Pool";
import { swap } from "../modules/swap";
import { collectFees } from "../modules/fee";
import { Bytes } from "@graphprotocol/graph-ts";
import * as constants from "../common/constants";
import { updatePosition } from "../modules/position";
import { transaction } from "../modules/transaction";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { getOrCreatePool, initializeSDK } from "../common/initializers";

export function handlePositionIncreased(event: IncreasePosition): void {
  const accountAddress = event.params.account;
  const collateralTokenAddress = event.params.collateralToken;
  const collateralValue = event.params.collateralValue;
  const feeValue = event.params.feeValue;
  const indexPrice = event.params.indexPrice;
  const indexTokenAddress = event.params.indexToken;
  const key = event.params.key;
  const side = event.params.side;
  const sizeChange = event.params.sizeChanged;
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    constants.IS_COLLATERAL_IN_USD,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.COLLATERAL_IN,
    constants.BIGINT_ZERO,
    sdk,
    pool
  );

  collectFees(feeValue, indexTokenAddress, sdk, pool, true);
  //fee in usd
}

export function handlePositionDecreased(event: DecreasePosition): void {
  const accountAddress = event.params.account;
  const collateralTokenAddress = event.params.collateralToken;
  const collateralValue = event.params.collateralChanged;
  const feeValue = event.params.feeValue;
  const indexPrice = event.params.indexPrice;
  const indexTokenAddress = event.params.indexToken;
  const key = event.params.key;
  const side = event.params.side;
  const sizeChange = event.params.sizeChanged;
  const pnl = event.params.pnl.abs.times(
    event.params.pnl.sig.equals(constants.BIGINT_ZERO)
      ? constants.BIGINT_NEGONE
      : constants.BIGINT_ONE
  );
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    true,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.COLLATERAL_OUT,
    pnl,
    sdk,
    pool
  );
  collectFees(feeValue, indexTokenAddress, sdk, pool, true);
  //fee in usd
}
export function handlePositionDecreasedWithoutSignedPnl(
  event: DecreasePositionWithoutSignedPnl
): void {
  const accountAddress = event.params.account;
  const collateralTokenAddress = event.params.collateralToken;
  const collateralValue = event.params.collateralChanged;
  const feeValue = event.params.feeValue;
  const indexPrice = event.params.indexPrice;
  const indexTokenAddress = event.params.indexToken;
  const key = event.params.key;
  const side = event.params.side;
  const sizeChange = event.params.sizeChanged;
  const pnl = event.params.pnl;
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    true,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.COLLATERAL_OUT,
    pnl,
    sdk,
    pool
  );
  collectFees(feeValue, indexTokenAddress, sdk, pool, true);
  //fee in usd
}
export function handlePositionLiquidated(event: LiquidatePosition): void {
  const accountAddress = event.params.account;
  const collateralTokenAddress = event.params.collateralToken;
  const collateralValue = event.params.collateralValue;
  const feeValue = event.params.feeValue;
  const indexPrice = event.params.indexPrice;
  const indexTokenAddress = event.params.indexToken;
  const key = event.params.key;
  const side = event.params.side;
  const sizeChange = event.params.size;
  const realisedPnl = event.params.pnl.abs.times(
    event.params.pnl.sig.equals(constants.BIGINT_ZERO)
      ? constants.BIGINT_NEGONE
      : constants.BIGINT_ONE
  );
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    true,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.LIQUIDATE,
    realisedPnl,
    sdk,
    pool
  );
  collectFees(feeValue, indexTokenAddress, sdk, pool, true);
  //fee in usd
}
export function handlePositionLiquidatedWithoutSignedPnl(
  event: LiquidatePositionWithoutSignedPnl
): void {
  const accountAddress = event.params.account;
  const collateralTokenAddress = event.params.collateralToken;
  const collateralValue = event.params.collateralValue;
  const feeValue = event.params.feeValue;
  const indexPrice = event.params.indexPrice;
  const indexTokenAddress = event.params.indexToken;
  const key = event.params.key;
  const side = event.params.side;
  const sizeChange = event.params.size;
  const realisedPnl = event.params.pnl;
  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    true,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.LIQUIDATE,
    realisedPnl,
    sdk,
    pool
  );
  collectFees(feeValue, indexTokenAddress, sdk, pool, true);
  //fee in usd
}

export function handleTokenDelisted(event: TokenDelisted): void {
  const tokenAddress = event.params.token;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  token._isWhitelisted = false;
  token.save();
  const inputTokens = pool.getInputTokens();
  const idx = inputTokens.indexOf(
    Bytes.fromHexString(tokenAddress.toHexString())
  );
  const inputTokenBalances = pool.pool.inputTokenBalances;
  inputTokenBalances[idx] = constants.BIGINT_ZERO;
  pool.setInputTokenBalances(inputTokenBalances);
}

export function handleTokenWhitelisted(event: TokenWhitelisted): void {
  const tokenAddress = event.params.token;

  const sdk = initializeSDK(event);
  const token = sdk.Tokens.getOrCreateToken(tokenAddress);
  token._isWhitelisted = true;
  token.save();
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const amount = event.params.amount;
  const fee = event.params.fee;
  const lpAmount = event.params.lpAmount;
  const senderAddress = event.params.sender;
  const tokenAddress = event.params.token;
  const tranche = event.params.tranche;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  transaction(
    senderAddress,
    tokenAddress,
    tranche,
    lpAmount,
    TransactionType.DEPOSIT,
    sdk,
    pool,
    amount
  );
  //fee in token in 18 decimals

  collectFees(fee, tokenAddress, sdk, pool);
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  const amount = event.params.amountOut;
  const fee = event.params.fee;
  const lpAmount = event.params.lpAmount;
  const senderAddress = event.params.sender;
  const tokenAddress = event.params.token;
  const tranche = event.params.tranche;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  transaction(
    senderAddress,
    tokenAddress,
    tranche,
    lpAmount,
    TransactionType.WITHDRAW,
    sdk,
    pool,
    amount
  );
  //fee in token in 18 decimals
  collectFees(fee, tokenAddress, sdk, pool);
}

export function handleSwap(event: Swap): void {
  const amountIn = event.params.amountIn;
  const amountOut = event.params.amountOut;
  const tokenInAddress = event.params.tokenIn;
  const tokenOutAddress = event.params.tokenOut;
  const accountAddress = event.params.sender;
  const fee = event.params.fee;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);
  swap(
    accountAddress,
    tokenInAddress,
    amountIn,
    tokenOutAddress,
    amountOut,
    sdk,
    pool
  );
  //fee is in 18 decimals in amount in price
  collectFees(fee, tokenInAddress, sdk, pool);
}

export function handleSwapWithPrices(event: SwapWithPrices): void {
  const amountIn = event.params.amountIn;
  const amountOut = event.params.amountOut;
  const tokenInAddress = event.params.tokenIn;
  const tokenOutAddress = event.params.tokenOut;
  const accountAddress = event.params.sender;
  const fee = event.params.fee;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  swap(
    accountAddress,
    tokenInAddress,
    amountIn,
    tokenOutAddress,
    amountOut,
    sdk,
    pool
  );
  //fee is in 18 decimals in amount in price
  collectFees(fee, tokenInAddress, sdk, pool);
}

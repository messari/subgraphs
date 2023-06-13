import {
  ClosePosition,
  DaoFeeSet,
  DecreasePosition,
  IncreasePosition,
  InterestAccrued,
  LiquidatePosition,
  LiquidityAdded,
  LiquidityRemoved,
  Swap,
  TokenRiskFactorUpdated,
  TokenWhitelisted,
  UpdatePosition,
} from "../../generated/Pool/Pool";
import { swap } from "../modules/swap";
import { collectFees } from "../modules/fee";
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
    false,
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

export function handleUpdatePosition(event: UpdatePosition): void {
  // event.params.collateralValue
  // event.params.entryInterestRate
  // event.params.entryPrice
  // event.params.indexPrice
  // event.params.key
  // event.params.reserveAmount
  // event.params.size;
}

export function handleClosePosition(event: ClosePosition): void {
  //increase poolVolume

  event.params.collateralValue;
  event.params.entryInterestRate;
  event.params.entryPrice;
  event.params.key;
  event.params.reserveAmount;
  event.params.size;
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

export function handleInterestAccrued(event: InterestAccrued): void {
  //not required
}

export function handleDaoFeeSet(event: DaoFeeSet): void {
  //not required
}

export function handleTokenRiskFactorUpdated(
  event: TokenRiskFactorUpdated
): void {
  //not required
}

export function handleTokenWhitelisted(event: TokenWhitelisted): void {
  //not required
}

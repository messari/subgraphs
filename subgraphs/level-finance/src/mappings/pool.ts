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
import { getOrCreatePool, initializeSDK } from "../common/initializers";
import { collectFees } from "../modules/fee";
import { swap } from "../modules/swap";
import * as constants from "../common/constants";
import { updatePosition } from "../modules/position";
import { TransactionType } from "../sdk/protocols/perpfutures/enums";
import { transaction } from "../modules/transaction";

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

  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.COLLATERAL_IN,
    constants.BIGINT_ZERO
  );
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

  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.COLLATERAL_OUT,
    constants.BIGINT_ZERO
  );
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
  const realisedPnl = event.params.pnl;
  updatePosition(
    event,
    key,
    accountAddress,
    collateralTokenAddress,
    collateralValue,
    indexTokenAddress,
    sizeChange,
    indexPrice,
    feeValue,
    side == constants.Side.LONG,
    TransactionType.LIQUIDATE,
    realisedPnl
  );
}

export function handleUpdatePosition(event: UpdatePosition): void {}

export function handleClosePosition(event: ClosePosition): void {}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  const amount = event.params.amount;
  const fee = event.params.fee;
  const lpAmount = event.params.lpAmount;
  const senderAddress = event.params.sender;
  const tokenAddress = event.params.token;

  const sdk = initializeSDK(event);
  const pool = getOrCreatePool(sdk);

  transaction(
    senderAddress,
    tokenAddress,
    constants.BIGINT_ZERO,
    lpAmount,
    TransactionType.DEPOSIT,
    amount,
    sdk,
    pool
  );
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
    constants.BIGINT_ZERO,
    lpAmount,
    TransactionType.WITHDRAW,
    amount,
    sdk,
    pool
  );
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
  collectFees(fee, tokenInAddress, sdk, pool);
  //
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

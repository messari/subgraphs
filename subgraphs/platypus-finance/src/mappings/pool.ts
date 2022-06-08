import {
  Deposit,
  Withdraw,
  Swap,
  AssetAdded,
  HaircutRateUpdated,
  RetentionRatioUpdated,
} from "../../generated/Pool/Pool";
import { TransactionType } from "../common/constants";
import { getOrCreateLiquidityPoolParamsHelper } from "../common/getters";

import {
  updateFinancials,
  updatePoolMetrics,
  updateSwapMetrics,
  updateUsageMetrics,
  updateFeeMetrics,
  updateProtocolTVL,
} from "../common/metrics";
import { createDeposit, createAsset, createWithdraw, createSwap } from "./helpers";

export function handleDeposit(event: Deposit): void {
  createDeposit(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );

  updateFinancials(event);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updatePoolMetrics(event);
}

export function handleWithdraw(event: Withdraw): void {
  createWithdraw(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );

  updateFinancials(event);
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updatePoolMetrics(event);
}

export function handleSwap(event: Swap): void {
  let swap = createSwap(
    event,
    event.params.sender,
    event.params.fromToken,
    event.params.toToken,
    event.params.fromAmount,
    event.params.toAmount,
    event.params.to,
  );

  updateFinancials(event);
  updateFeeMetrics(event, event.address, swap);
  updateSwapMetrics(event, swap);
  updateUsageMetrics(event, event.params.sender, TransactionType.SWAP);
  updatePoolMetrics(event);
}

export function handleAssetAdded(event: AssetAdded): void {
  createAsset(event, event.address, event.params.token, event.params.asset);
  updateProtocolTVL(event);
  updatePoolMetrics(event);
}

export function handleRetentionRatioUpdated(event: RetentionRatioUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.RetentionRatio = event.params.newRetentionRatio.toBigDecimal();
  liquidityPoolParams.save();
}

export function handleHaircutRateUpdated(event: HaircutRateUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.HaircutRate = event.params.newHaircut.toBigDecimal();
  liquidityPoolParams.save();
}

// Pools are the liqudity pools (there are only 2 in platypus)
import { log } from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  Swap,
  DevUpdated,
  SlippageParamsUpdated,
  OracleUpdated,
  RetentionRatioUpdated,
  PriceDeviationUpdated,
  HaircutRateUpdated,
  AssetAdded,
} from "../../generated/Pool/Pool";
import { TransactionType } from "../common/constants";
import { updateFinancials, updatePoolMetrics, updateUsageMetrics } from "../common/metrics";
import { createDeposit, createAsset, createWithdraw } from "./helpers";

export function handleDeposit(event: Deposit): void {
  // steps to implement
  // 1. Create Deposit
  // 2. Update Financials
  // 3. Update Protocol Usage Metrics - Timeseries
  // 4. Update Pool Metrics - Timeseries

  // Create Deposit
  createDeposit(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  // Update Financials
  updateFinancials(event);
  // Update Protocol Usage Metrics
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  // Update Pool Metrics
  updatePoolMetrics(event, event.address);
}

export function handleWithdraw(event: Withdraw): void {
  // steps to implement
  // 1. create Deposit
  // 2. Update Financials
  // 3. Update Protocol Usage Metrics
  // 4. Update Pool Metrics

  // Create Deposit
  createWithdraw(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  // Update Financials
  updateFinancials(event);
  // Update Protocol Usage Metrics
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  // Update Pool Metrics
  updatePoolMetrics(event, event.address);
}

export function handleSwap(event: Swap): void {
  // create Swap
  // Update Financials
  // Update Usage Metrics
  // Update Pool Metrics
}

export function handleAssetAdded(event: AssetAdded): void {
  createAsset(event, event.address, event.params.token, event.params.asset);

  // A new LP token is added to this pool
  // Initialize Asset Contract with Address
  // Initialize Asset Address to Oracle
}

export function handleDevUpdated(event: DevUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}
export function handleSlippageParamsUpdated(event: SlippageParamsUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}
export function handleOracleUpdated(event: OracleUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}
export function handleRetentionRatioUpdated(event: RetentionRatioUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}
export function handlePriceDeviationUpdated(event: PriceDeviationUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}
export function handleHaircutRateUpdated(event: HaircutRateUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  // Update LiquidityPoolParamsHelper
}

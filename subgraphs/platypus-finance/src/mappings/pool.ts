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
import { getOrCreateLiquidityPoolParamsHelper } from "../common/getters";
import { updateFinancials, updatePoolMetrics, updateSwapMetrics, updateUsageMetrics } from "../common/metrics";
import { createDeposit, createAsset, createWithdraw, createSwap } from "./helpers";

export function handleDeposit(event: Deposit): void {
  // Steps to implement
  // 1. Create Deposit
  // 2. Update Financials
  // 3. Update Protocol Usage Metrics - Timeseries
  // 4. Update Pool Metrics - Timeseries

  // Pending
  //  Update Token Balances in Pool Entity
  //  Update TVL for pools and protocol
  //  HandleSwap Pending:
  //
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
  updatePoolMetrics(event);
}

export function handleWithdraw(event: Withdraw): void {
  // Steps to implement
  // 1. Create Withdraw
  // 2. Update Financials
  // 3. Update Protocol Usage Metrics
  // 4. Update Pool Metrics

  // Create Withdraw
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
  updatePoolMetrics(event);
}

export function handleSwap(event: Swap): void {
  // Steps to implement
  // 1.Create Swap - Done
  // 2. Update Fee Metrics
  // 3. Update Swap Metrics
  // 4. Update Usage Metrics - Done
  // 5. Update Pool Metrics

  // Create Swap, Update Swap Volumes
  log.debug("handling swap", []);
  let swap = createSwap(
    event,
    event.params.sender,
    event.params.fromToken,
    event.params.toToken,
    event.params.fromAmount,
    event.params.toAmount,
    event.params.to,
  );
  log.debug("swap created {}", [swap.hash])
  // Update Swap Metrics
  updateSwapMetrics(event, swap);
  // Update Usage Metrics
  updateUsageMetrics(event, event.params.sender, TransactionType.SWAP);
}

export function handleAssetAdded(event: AssetAdded): void {
  createAsset(event, event.address, event.params.token, event.params.asset);

  // A new LP token is added to this pool
  // Initialize Asset Contract with Address
  // Initialize Asset Address to Oracle
}

export function handleDevUpdated(event: DevUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.Dev = event.params.newDev.toHexString();
  liquidityPoolParams.save();
}
export function handleSlippageParamsUpdated(event: SlippageParamsUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.SlippageParamsXThreshold = event.params.newXThreshold.toBigDecimal();
  liquidityPoolParams.SlippageParamsC1 = event.params.newC1.toBigDecimal();
  liquidityPoolParams.SlippageParamsK = event.params.newK.toBigDecimal();
  liquidityPoolParams.SlippageParamsN = event.params.newN.toBigDecimal();
  liquidityPoolParams.save();
}
export function handleOracleUpdated(event: OracleUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.Oracle = event.params.newOracle.toHexString();
  liquidityPoolParams.save();
}
export function handleRetentionRatioUpdated(event: RetentionRatioUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.RetentionRatio = event.params.newRetentionRatio.toBigDecimal();
  liquidityPoolParams.save();
}
export function handlePriceDeviationUpdated(event: PriceDeviationUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.PriceDeviation = event.params.newPriceDeviation.toBigDecimal();
  liquidityPoolParams.save();
}
export function handleHaircutRateUpdated(event: HaircutRateUpdated): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event.address);
  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.HaircutRate = event.params.newHaircut.toBigDecimal();
  liquidityPoolParams.save();
}

// Pools are the liqudity pools (there are only 2 in platypus)

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

export function handleDeposit(event: Deposit): void {
  // create Deposit
  // Update Financials
  // Update Usage Metrics
  // Update Pool Metrics
}

export function handleWithdraw(event: Withdraw): void {
  // create Deposit
  // Update Financials
  // Update Usage Metrics
  // Update Pool Metrics
}

export function handleSwap(event: Swap): void {
  // create Swap
  // Update Financials
  // Update Usage Metrics
  // Update Pool Metrics
}

export function handleAssetAdded(event: AssetAdded): void {
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

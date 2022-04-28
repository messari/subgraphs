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
import { createDeposit, createAsset } from "./helpers";

export function handleDeposit(event: Deposit): void {
  // log.debug(
  //   "Block number: {}, block hash: {}, transaction hash: {}, amount: {}, token:{}, liquidity:{}, to:{}, sender: {}",
  //   [
  //     event.block.number.toString(), // "47596000"
  //     event.block.hash.toHexString(), // "0x..."
  //     event.transaction.hash.toHexString(), // "0x..."
  //     event.params.amount.toString(),
  //     event.params.token.toHexString(),
  //     event.params.liquidity.toString(),
  //     event.params.to.toHexString(),
  //     event.params.sender.toHexString(),
  //   ],
  // );

  createDeposit(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
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
  createAsset(
    event,
    event.address,
    event.params.token,
    event.params.asset,
  );

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

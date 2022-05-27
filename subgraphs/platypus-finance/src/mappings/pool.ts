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

import { Deposit as DepositSchema, Swap as SwapSchema, Withdraw as WithdrawSchema } from "../../generated/schema";
import { TransactionType } from "../common/constants";
import { getOrCreateLiquidityPoolParamsHelper } from "../common/getters";

import {
  updateFinancials,
  updatePoolMetrics,
  updateSwapMetrics,
  updateUsageMetrics,
  updateFeeMetrics,
} from "../common/metrics";
import { createDeposit, createAsset, createWithdraw, createSwap } from "./helpers";

export function handleDeposit(event: Deposit): void {
  let deposit = createDeposit(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  // updateBalancesInPool<DepositSchema>(event, deposit, TransactionType.DEPOSIT);
  // updateProtocolTVL(event);
  updateFinancials(event);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updatePoolMetrics(event);
}

export function handleWithdraw(event: Withdraw): void {
  let withdraw = createWithdraw(
    event,
    event.params.amount,
    event.params.token,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  // updateBalancesInPool<WithdrawSchema>(event, withdraw, TransactionType.WITHDRAW);
  // updateProtocolTVL(event);
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
  // updateBalancesInPoolAfterSwap(event, swap);
  // updateProtocolTVL(event);
  updateFinancials(event);
  updateFeeMetrics(event, event.address, swap);
  updateSwapMetrics(event, swap);
  updateUsageMetrics(event, event.params.sender, TransactionType.SWAP);
  updatePoolMetrics(event);
}

export function handleAssetAdded(event: AssetAdded): void {
  createAsset(event, event.address, event.params.token, event.params.asset);
  updatePoolMetrics(event);
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
  log.debug("event to update oracle from {} to {}", [
    event.params.previousOracle.toHexString(),
    event.params.newOracle.toHexString(),
  ]);
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

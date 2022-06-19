import { Address, log } from "@graphprotocol/graph-ts";
import {
  Pool,
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

  fetchRetentionRatio(event.address);
  fetchHaircutRate(event.address);
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

export function fetchRetentionRatio(poolAddress: Address): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(poolAddress);
  let PoolContract = Pool.bind(poolAddress);
  let retentionRatio_call = PoolContract.try_getRetentionRatio();

  if (retentionRatio_call.reverted) {
    log.error("[Fetch Retention Ratio]Error fetching Retention Ration for address: {}", [poolAddress.toString()]);
  }

  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.RetentionRatio = retentionRatio_call.value.toBigDecimal();
  liquidityPoolParams.save();
}

export function fetchHaircutRate(poolAddress: Address): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(poolAddress);
  let PoolContract = Pool.bind(poolAddress);
  let haircutRate_call = PoolContract.try_getHaircutRate();

  if (haircutRate_call.reverted) {
    log.error("[Fetch Haircut Rate]Error fetching Haircut Rate for address: {}", [poolAddress.toString()]);
  }

  // Update LiquidityPoolParamsHelper
  liquidityPoolParams.HaircutRate = haircutRate_call.value.toBigDecimal();
  liquidityPoolParams.save();
}

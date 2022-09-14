import { Address, ethereum, log } from "@graphprotocol/graph-ts";
import { Pool, Deposit, Withdraw, Swap, AssetAdded } from "../../generated/Pool/Pool";
import { TransactionType, ZERO_ADDRESS } from "../common/constants";
import { getAssetAddressForPoolToken, getOrCreateLiquidityPoolParamsHelper } from "../common/getters";
import {
  updateFinancials,
  updatePoolMetrics,
  updateUsageMetrics,
  updateProtocolTVL,
  updateMetricsAfterSwap,
} from "../common/metrics";
import { createDeposit, createAsset, createWithdraw, createSwap } from "./helpers";

export function handleDeposit(event: Deposit): void {
  let assetAddress = getAssetAddressForPoolToken(event, event.address, event.params.token);
  if (assetAddress.equals(ZERO_ADDRESS)) {
    log.error("[{}][AssetNotFound] Asset {} not found in Pool {} for token {}", [
      event.transaction.hash.toHexString(),
      assetAddress.toHexString(),
      event.address.toHexString(),
      event.params.token.toHexString(),
    ]);
    return;
  }
  createDeposit(
    event,
    event.params.amount,
    event.params.token,
    assetAddress,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  updateFinancials(event);
  updateUsageMetrics(event, event.params.sender, TransactionType.DEPOSIT);
  updatePoolMetrics(event, assetAddress, event.params.token);
}

export function handleWithdraw(event: Withdraw): void {
  let assetAddress = getAssetAddressForPoolToken(event, event.address, event.params.token);
  if (assetAddress.equals(ZERO_ADDRESS)) {
    log.error("[{}][AssetNotFound] Asset {} not found in Pool {} for token {}", [
      event.transaction.hash.toHexString(),
      assetAddress.toHexString(),
      event.address.toHexString(),
      event.params.token.toHexString(),
    ]);
    return;
  }
  createWithdraw(
    event,
    event.params.amount,
    event.params.token,
    assetAddress,
    event.params.liquidity,
    event.params.to,
    event.params.sender,
  );
  updateFinancials(event);
  updateUsageMetrics(event, event.params.sender, TransactionType.WITHDRAW);
  updatePoolMetrics(event, assetAddress, event.params.token);
}

export function handleSwap(event: Swap): void {
  let fromAssetAddress = getAssetAddressForPoolToken(event, event.address, event.params.fromToken);
  if (fromAssetAddress.equals(ZERO_ADDRESS)) {
    log.error("[{}][AssetNotFound] Asset {} not found in Pool {} for token {}", [
      event.transaction.hash.toHexString(),
      fromAssetAddress.toHexString(),
      event.address.toHexString(),
      event.params.fromToken.toHexString(),
    ]);
    return;
  }
  let toAssetAddress = getAssetAddressForPoolToken(event, event.address, event.params.toToken);
  if (toAssetAddress.equals(ZERO_ADDRESS)) {
    log.error("[{}][AssetNotFound] Asset {} not found in Pool {} for token {}", [
      event.transaction.hash.toHexString(),
      toAssetAddress.toHexString(),
      event.address.toHexString(),
      event.params.toToken.toHexString(),
    ]);
    return;
  }
  fetchRetentionRatioAndHaircutRate(event, event.address);
  updateMetricsAfterSwap(
    event,
    event.address,
    fromAssetAddress,
    toAssetAddress,
    event.params.fromToken,
    event.params.toToken,
    event.params.fromAmount,
    event.params.toAmount,
    event.params.sender,
    event.params.to,
  );
  updateUsageMetrics(event, event.params.sender, TransactionType.SWAP);
}

export function handleAssetAdded(event: AssetAdded): void {
  createAsset(event, event.address, event.params.token, event.params.asset);
  updateProtocolTVL(event, event.params.asset);
}

export function fetchRetentionRatioAndHaircutRate(event: ethereum.Event, poolAddress: Address): void {
  // Get LiquidtiyPoolParamsHelper
  let liquidityPoolParams = getOrCreateLiquidityPoolParamsHelper(event, poolAddress);
  if (liquidityPoolParams.updateBlockNumber.lt(event.block.number)) {
    let PoolContract = Pool.bind(poolAddress);
    let retentionRatio_call = PoolContract.try_getRetentionRatio();

    if (retentionRatio_call.reverted) {
      log.error("[Fetch Retention Ratio]Error fetching Retention Ration for address: {}", [poolAddress.toHexString()]);
    }
    // Update LiquidityPoolParamsHelper
    liquidityPoolParams.RetentionRatio = retentionRatio_call.value.toBigDecimal();

    let haircutRate_call = PoolContract.try_getHaircutRate();

    if (haircutRate_call.reverted) {
      log.error("[Fetch Haircut Rate]Error fetching Haircut Rate for address: {}", [poolAddress.toHexString()]);
    }

    // Update LiquidityPoolParamsHelper
    liquidityPoolParams.HaircutRate = haircutRate_call.value.toBigDecimal();

    liquidityPoolParams.updateBlockNumber = event.block.number;
    liquidityPoolParams.save();
  }
}

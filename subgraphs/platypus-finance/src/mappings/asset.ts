// Asset is the LP token for each Token that is added to a pool

import { Transfer, MaxSupplyUpdated, PoolUpdated, CashAdded, CashRemoved } from "../../generated/templates/Asset/Asset";
import { Address, log } from "@graphprotocol/graph-ts";
import { LiquidityPoolDailySnapshot, LiquidityPoolHourlySnapshot, _Asset } from "../../generated/schema";
import { updatePoolMetrics, updateProtocolTVL } from "../common/metrics";
import { getOrCreateLiquidityPool, getOrCreateLiquidityPoolDailySnapshot } from "../common/getters";
import { BIGDECIMAL_ONE, BIGDECIMAL_ZERO, BIGINT_ZERO, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../common/constants";

export function handleCashAdded(event: CashAdded): void {
  let _asset = _Asset.load(event.address.toHexString())!;
  _asset.cash = _asset.cash.plus(event.params.cashBeingAdded);
  _asset.save();
  updateProtocolTVL(event);
}

export function handleCashRemoved(event: CashRemoved): void {
  let _asset = _Asset.load(event.address.toHexString())!;
  _asset.cash = _asset.cash.minus(event.params.cashBeingRemoved);
  _asset.save();
  updateProtocolTVL(event);
}

export function handleTransfer(event: Transfer): void {
  // noop
}
export function handleMaxSupplyUpdated(event: MaxSupplyUpdated): void {
  // noop
}
export function handlePoolUpdated(event: PoolUpdated): void {
  log.debug("[ChangePool] Tx: {} for asset {} from {} to {}", [
    event.transaction.hash.toHexString(),
    event.address.toHexString(),
    event.params.previousPool.toHexString(),
    event.params.newPool.toHexString(),
  ]);

  let _asset = _Asset.load(event.address.toHexString())!;
  let oldPool = getOrCreateLiquidityPool(Address.fromString(_asset.pool));

  log.debug("[ChangePool] oldPool OldInputTokens {} OldBalances {}", [
    oldPool.inputTokens.toString(),
    oldPool.inputTokenBalances.toString(),
  ]);

  let oldPoolIndex = oldPool.inputTokens.indexOf(_asset.token);

  let oldPoolUpdatedAssets = oldPool._assets.slice(0, oldPoolIndex).concat(oldPool._assets.slice(oldPoolIndex + 1));
  let oldPoolUpdatedInputTokens = oldPool.inputTokens
    .slice(0, oldPoolIndex)
    .concat(oldPool.inputTokens.slice(oldPoolIndex + 1));
  let oldPoolUpdatedInputTokenBalances = oldPool.inputTokenBalances
    .slice(0, oldPoolIndex)
    .concat(oldPool.inputTokenBalances.slice(oldPoolIndex + 1));

  oldPool._assets = oldPoolUpdatedAssets;
  oldPool.inputTokens = oldPoolUpdatedInputTokens;
  oldPool.inputTokenBalances = oldPoolUpdatedInputTokenBalances;

  log.debug("[ChangePool] oldPool newInputTokens {} newBalances {}", [
    oldPool.inputTokens.toString(),
    oldPool.inputTokenBalances.toString(),
  ]);

  oldPool.save();

  let newPool = getOrCreateLiquidityPool(event.params.newPool);
  _asset.pool = newPool.id;
  _asset.save();

  let newPoolUpdatedAssets = newPool._assets;
  let newPoolUpdatedInputTokens = newPool.inputTokens;

  log.debug("[ChangePool] newPool OldInputTokens {} OldBalances {}", [
    newPool.inputTokens.toString(),
    newPool.inputTokenBalances.toString(),
  ]);

  newPoolUpdatedInputTokens.push(_asset.token);
  newPoolUpdatedAssets.push(_asset.id);
  newPoolUpdatedInputTokens.sort();

  let newPoolIndex = newPoolUpdatedInputTokens.indexOf(_asset.token);

  let newPoolUpdatedInputTokenBalances = newPool.inputTokenBalances
    .slice(0, newPoolIndex)
    .concat([_asset.cash])
    .concat(newPool.inputTokenBalances.slice(newPoolIndex));

  newPool._assets = newPoolUpdatedAssets;
  newPool.inputTokens = newPoolUpdatedInputTokens;
  newPool.inputTokenBalances = newPoolUpdatedInputTokenBalances;
  newPool.save();

  log.debug("[ChangePool] newPool newInputTokens {} newBalances {}", [
    newPool.inputTokens.toString(),
    newPool.inputTokenBalances.toString(),
  ]);

  log.debug("[ChangePool] Done! oldPoolIndex = {} newPoolIndex = {}", [
    oldPoolIndex.toString(),
    newPoolIndex.toString(),
  ]);

  updateProtocolTVL(event);

  let timestampHourly: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let oldIdHourly: string = oldPool.id.concat("-").concat(timestampHourly.toString());

  let oldPoolHourlySnapshot = LiquidityPoolHourlySnapshot.load(oldIdHourly);
  if (oldPoolHourlySnapshot) {
    oldPoolHourlySnapshot._assets = oldPool._assets;
    oldPoolHourlySnapshot._inputTokens = oldPool.inputTokens;
    oldPoolHourlySnapshot.inputTokenBalances = oldPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = oldPoolHourlySnapshot.hourlyVolumeByTokenAmount
      .slice(0, oldPoolIndex)
      .concat(oldPoolHourlySnapshot.hourlyVolumeByTokenAmount.slice(oldPoolIndex + 1));
    let newSwapVolumeUSD = oldPoolHourlySnapshot.hourlyVolumeByTokenUSD
      .slice(0, oldPoolIndex)
      .concat(oldPoolHourlySnapshot.hourlyVolumeByTokenUSD.slice(oldPoolIndex + 1));

    oldPoolHourlySnapshot.hourlyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    oldPoolHourlySnapshot.hourlyVolumeByTokenUSD = newSwapVolumeUSD;
    oldPoolHourlySnapshot.save();
  }

  let timestampDaily: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let idDaily: string = oldPool.id.concat("-").concat(timestampDaily.toString());

  let oldPoolDailySnapshot = LiquidityPoolDailySnapshot.load(idDaily);
  if (oldPoolDailySnapshot) {
    oldPoolDailySnapshot._assets = oldPool._assets;
    oldPoolDailySnapshot._inputTokens = oldPool.inputTokens;
    oldPoolDailySnapshot.inputTokenBalances = oldPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = oldPoolDailySnapshot.dailyVolumeByTokenAmount
      .slice(0, oldPoolIndex)
      .concat(oldPoolDailySnapshot.dailyVolumeByTokenAmount.slice(oldPoolIndex + 1));
    let newSwapVolumeUSD = oldPoolDailySnapshot.dailyVolumeByTokenUSD
      .slice(0, oldPoolIndex)
      .concat(oldPoolDailySnapshot.dailyVolumeByTokenUSD.slice(oldPoolIndex + 1));

    oldPoolDailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    oldPoolDailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    oldPoolDailySnapshot.save();
  }

  let newIdHourly: string = newPool.id.concat("-").concat(timestampHourly.toString());
  let newPoolHourlySnapshot = LiquidityPoolHourlySnapshot.load(newIdHourly);
  if (newPoolHourlySnapshot) {
    newPoolHourlySnapshot._assets = newPool._assets;
    newPoolHourlySnapshot._inputTokens = newPool.inputTokens;
    newPoolHourlySnapshot.inputTokenBalances = newPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = newPoolHourlySnapshot.hourlyVolumeByTokenAmount
      .slice(0, newPoolIndex)
      .concat([BIGINT_ZERO])
      .concat(newPoolHourlySnapshot.hourlyVolumeByTokenAmount.slice(newPoolIndex));
    let newSwapVolumeUSD = newPoolHourlySnapshot.hourlyVolumeByTokenUSD
      .slice(0, newPoolIndex)
      .concat([BIGDECIMAL_ZERO])
      .concat(newPoolHourlySnapshot.hourlyVolumeByTokenUSD.slice(newPoolIndex));

    newPoolHourlySnapshot.hourlyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    newPoolHourlySnapshot.hourlyVolumeByTokenUSD = newSwapVolumeUSD;
    newPoolHourlySnapshot.save();
  }

  let newIdDaily: string = newPool.id.concat("-").concat(timestampDaily.toString());
  let newPoolDailySnapshot = LiquidityPoolDailySnapshot.load(newIdDaily);
  if (newPoolDailySnapshot) {
    newPoolDailySnapshot._assets = newPool._assets;
    newPoolDailySnapshot._inputTokens = newPool.inputTokens;
    newPoolDailySnapshot.inputTokenBalances = newPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = newPoolDailySnapshot.dailyVolumeByTokenAmount
      .slice(0, newPoolIndex)
      .concat([BIGINT_ZERO])
      .concat(newPoolDailySnapshot.dailyVolumeByTokenAmount.slice(newPoolIndex));
    let newSwapVolumeUSD = newPoolDailySnapshot.dailyVolumeByTokenUSD
      .slice(0, newPoolIndex)
      .concat([BIGDECIMAL_ZERO])
      .concat(newPoolDailySnapshot.dailyVolumeByTokenUSD.slice(newPoolIndex));

    newPoolDailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    newPoolDailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    newPoolDailySnapshot.save();
  }
}

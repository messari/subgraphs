// Asset is the LP token for each Token that is added to a pool

import { Transfer, MaxSupplyUpdated, PoolUpdated, CashAdded, CashRemoved } from "../../generated/templates/Asset/Asset";
import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
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

function slicer<T>(x: T[], start: i32, end: i32, insert: T[] = []): T[] {
  return x.slice(0, start).concat(insert).concat(x.slice(end));
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

  let oldPoolUpdatedAssets = slicer<string>(oldPool._assets, oldPoolIndex, oldPoolIndex + 1);
  let oldPoolUpdatedInputTokens = slicer<string>(oldPool.inputTokens, oldPoolIndex, oldPoolIndex + 1);
  let oldPoolUpdatedInputTokenBalances = slicer<BigInt>(oldPool.inputTokenBalances, oldPoolIndex, oldPoolIndex + 1);

  oldPool._assets = oldPoolUpdatedAssets;
  oldPool.inputTokens = oldPoolUpdatedInputTokens;
  oldPool.inputTokenBalances = oldPoolUpdatedInputTokenBalances;

  log.debug("[ChangePool] oldPool newInputTokens {} newBalances {}", [
    oldPool.inputTokens.toString(),
    oldPool.inputTokenBalances.toString(),
  ]);

  oldPool.save();

  let newPool = getOrCreateLiquidityPool(event.params.newPool);

  let newPoolUpdatedAssets = newPool._assets;
  let newPoolUpdatedInputTokens = newPool.inputTokens;

  newPoolUpdatedInputTokens.push(_asset.token);
  newPoolUpdatedAssets.push(_asset.id);
  newPoolUpdatedInputTokens = newPoolUpdatedInputTokens.sort();
  let newPoolIndex = newPoolUpdatedInputTokens.indexOf(_asset.token);
  let newPoolUpdatedInputTokenBalances = slicer<BigInt>(newPool.inputTokenBalances, newPoolIndex, newPoolIndex, [
    _asset.cash,
  ]);

  _asset.pool = newPool.id;
  _asset._index = BigInt.fromI32(newPoolIndex);
  _asset.save();

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

  log.debug("[ChangePool] Calling updateprotocol with event {}", [event.transaction.hash.toHexString()]);
  updateProtocolTVL(event);
  log.debug("[ChangePool] Called updateprotocol with event {}", [event.transaction.hash.toHexString()]);

  let timestampHourly: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let oldIdHourly: string = oldPool.id.concat("-").concat(timestampHourly.toString());

  let oldPoolHourlySnapshot = LiquidityPoolHourlySnapshot.load(oldIdHourly);
  log.debug("[ChangePool] Fetched Snapshot {}", [oldIdHourly]);

  if (oldPoolHourlySnapshot) {
    oldPoolHourlySnapshot._assets = oldPool._assets;
    oldPoolHourlySnapshot._inputTokens = oldPool.inputTokens;
    oldPoolHourlySnapshot.inputTokenBalances = oldPool.inputTokenBalances;

    log.debug("[ChangePool] oldPoolHourlySnapshot oldAMT {} oldUSD {}", [
      oldPoolHourlySnapshot.hourlyVolumeByTokenAmount.toString(),
      oldPoolHourlySnapshot.hourlyVolumeByTokenUSD.toString(),
    ]);

    let newSwapVolumeTokenAmount = slicer<BigInt>(
      oldPoolHourlySnapshot.hourlyVolumeByTokenAmount,
      oldPoolIndex,
      oldPoolIndex + 1,
    );

    let newSwapVolumeUSD = slicer<BigDecimal>(
      oldPoolHourlySnapshot.hourlyVolumeByTokenUSD,
      oldPoolIndex,
      oldPoolIndex + 1,
    );

    oldPoolHourlySnapshot.hourlyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    oldPoolHourlySnapshot.hourlyVolumeByTokenUSD = newSwapVolumeUSD;
    oldPoolHourlySnapshot.save();

    log.debug("[ChangePool] oldPoolHourlySnapshot newAMT {} newUSD {}", [
      oldPoolHourlySnapshot.hourlyVolumeByTokenAmount.toString(),
      oldPoolHourlySnapshot.hourlyVolumeByTokenUSD.toString(),
    ]);
  }

  let timestampDaily: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let idDaily: string = oldPool.id.concat("-").concat(timestampDaily.toString());

  let oldPoolDailySnapshot = LiquidityPoolDailySnapshot.load(idDaily);
  if (oldPoolDailySnapshot) {
    oldPoolDailySnapshot._assets = oldPool._assets;
    oldPoolDailySnapshot._inputTokens = oldPool.inputTokens;
    oldPoolDailySnapshot.inputTokenBalances = oldPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = slicer<BigInt>(
      oldPoolDailySnapshot.dailyVolumeByTokenAmount,
      oldPoolIndex,
      oldPoolIndex + 1,
    );

    let newSwapVolumeUSD = slicer<BigDecimal>(
      oldPoolDailySnapshot.dailyVolumeByTokenUSD,
      oldPoolIndex,
      oldPoolIndex + 1,
    );

    oldPoolDailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    oldPoolDailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    oldPoolDailySnapshot.save();
  }

  let newIdHourly: string = newPool.id.concat("-").concat(timestampHourly.toString());
  let newPoolHourlySnapshot = LiquidityPoolHourlySnapshot.load(newIdHourly);
  if (newPoolHourlySnapshot) {
    log.debug("[ChangePool] newPoolHourlySnapshot oldAMT {} oldUSD {}", [
      newPoolHourlySnapshot.hourlyVolumeByTokenAmount.toString(),
      newPoolHourlySnapshot.hourlyVolumeByTokenUSD.toString(),
    ]);

    newPoolHourlySnapshot._assets = newPool._assets;
    newPoolHourlySnapshot._inputTokens = newPool.inputTokens;
    newPoolHourlySnapshot.inputTokenBalances = newPool.inputTokenBalances;

    let newSwapVolumeTokenAmount = slicer<BigInt>(
      newPoolHourlySnapshot.hourlyVolumeByTokenAmount,
      newPoolIndex,
      newPoolIndex,
      [BIGINT_ZERO],
    );

    let newSwapVolumeUSD = slicer<BigDecimal>(
      newPoolHourlySnapshot.hourlyVolumeByTokenUSD,
      newPoolIndex,
      newPoolIndex,
      [BIGDECIMAL_ZERO],
    );

    newPoolHourlySnapshot.hourlyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    newPoolHourlySnapshot.hourlyVolumeByTokenUSD = newSwapVolumeUSD;
    newPoolHourlySnapshot.save();

    log.debug("[ChangePool] newPoolHourlySnapshot newAMT {} newUSD {}", [
      newPoolHourlySnapshot.hourlyVolumeByTokenAmount.toString(),
      newPoolHourlySnapshot.hourlyVolumeByTokenUSD.toString(),
    ]);
  }

  let newIdDaily: string = newPool.id.concat("-").concat(timestampDaily.toString());
  let newPoolDailySnapshot = LiquidityPoolDailySnapshot.load(newIdDaily);
  log.debug("[ChangePool] Final Fetched Snapshot {}", [newIdDaily]);

  if (newPoolDailySnapshot) {
    newPoolDailySnapshot._assets = newPool._assets;
    newPoolDailySnapshot._inputTokens = newPool.inputTokens;
    newPoolDailySnapshot.inputTokenBalances = newPool.inputTokenBalances;

    log.debug("[ChangePool] newPoolDailySnapshot oldAMT {} oldUSD {}", [
      newPoolDailySnapshot.dailyVolumeByTokenAmount.toString(),
      newPoolDailySnapshot.dailyVolumeByTokenUSD.toString(),
    ]);

    let newSwapVolumeTokenAmount = slicer<BigInt>(
      newPoolDailySnapshot.dailyVolumeByTokenAmount,
      newPoolIndex,
      newPoolIndex,
      [BIGINT_ZERO],
    );

    let newSwapVolumeUSD = slicer<BigDecimal>(newPoolDailySnapshot.dailyVolumeByTokenUSD, newPoolIndex, newPoolIndex, [
      BIGDECIMAL_ZERO,
    ]);

    newPoolDailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    newPoolDailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    newPoolDailySnapshot.save();

    log.debug("[ChangePool] newPoolDailySnapshot newAMT {} newUSD {}", [
      newPoolDailySnapshot.dailyVolumeByTokenAmount.toString(),
      newPoolDailySnapshot.dailyVolumeByTokenUSD.toString(),
    ]);
  }
}

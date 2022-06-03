// Asset is the LP token for each Token that is added to a pool

import { PoolUpdated, CashAdded, CashRemoved } from "../../generated/templates/Asset/Asset";
import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { LiquidityPoolDailySnapshot, LiquidityPoolHourlySnapshot, _Asset } from "../../generated/schema";
import { updateProtocolTVL } from "../common/metrics";
import { getOrCreateLiquidityPool } from "../common/getters";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, SECONDS_PER_DAY, SECONDS_PER_HOUR } from "../common/constants";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "../common/utils/arrays";

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

export function handlePoolUpdated(event: PoolUpdated): void {
  log.debug("[ChangePool] Tx: {} for asset {} from {} to {}", [
    event.transaction.hash.toHexString(),
    event.address.toHexString(),
    event.params.previousPool.toHexString(),
    event.params.newPool.toHexString(),
  ]);

  let _asset = _Asset.load(event.address.toHexString())!;
  let oldPool = getOrCreateLiquidityPool(Address.fromString(_asset.pool), event);

  log.debug("[ChangePool] oldPool oldAssets {} OldInputTokens {} OldBalances {}", [
    oldPool._assets.toString(),
    oldPool.inputTokens.toString(),
    oldPool.inputTokenBalances.toString(),
  ]);

  let oldPoolIndexInputTokens = oldPool.inputTokens.indexOf(_asset.token);
  let oldPoolIndexAssets = oldPool._assets.indexOf(_asset.id);

  let oldPoolUpdatedAssets = removeFromArrayAtIndex(oldPool._assets, oldPoolIndexAssets);
  let oldPoolUpdatedInputTokens = removeFromArrayAtIndex(oldPool.inputTokens, oldPoolIndexInputTokens);
  let oldPoolUpdatedInputTokenBalances = removeFromArrayAtIndex(oldPool.inputTokenBalances, oldPoolIndexInputTokens);

  oldPool._assets = oldPoolUpdatedAssets;
  oldPool.inputTokens = oldPoolUpdatedInputTokens;
  oldPool.inputTokenBalances = oldPoolUpdatedInputTokenBalances;

  oldPool.save();

  log.debug("[ChangePool] oldPool newAssets {} newInputTokens {} newBalances {}", [
    oldPool._assets.join(),
    oldPool.inputTokens.toString(),
    oldPool.inputTokenBalances.toString(),
  ]);

  let newPool = getOrCreateLiquidityPool(event.params.newPool, event);
  let newPoolUpdatedAssets = newPool._assets;
  let newPoolUpdatedInputTokens = newPool.inputTokens;

  log.debug("[ChangePool] newPool oldAssets {} OldInputTokens {} OldBalances {}", [
    newPool._assets.toString(),
    newPool.inputTokens.toString(),
    newPool.inputTokenBalances.toString(),
  ]);

  newPoolUpdatedInputTokens.push(_asset.token);
  newPoolUpdatedAssets.push(_asset.id);
  newPoolUpdatedInputTokens = newPoolUpdatedInputTokens.sort();
  newPoolUpdatedAssets = newPoolUpdatedAssets.sort();

  let newPoolIndexInputTokens = newPoolUpdatedInputTokens.indexOf(_asset.token);
  let newPoolIndexAssets = newPoolUpdatedAssets.indexOf(_asset.id);

  let newPoolUpdatedInputTokenBalances = addToArrayAtIndex(
    newPool.inputTokenBalances,
    _asset.cash,
    newPoolIndexInputTokens,
  );

  _asset.pool = newPool.id;
  _asset.save();

  newPool._assets = newPoolUpdatedAssets;
  newPool.inputTokens = newPoolUpdatedInputTokens;
  newPool.inputTokenBalances = newPoolUpdatedInputTokenBalances;
  newPool.save();

  log.debug("[ChangePool] newPool newAssets {} newInputTokens {} newBalances {}", [
    newPool._assets.join(),
    newPool.inputTokens.toString(),
    newPool.inputTokenBalances.toString(),
  ]);

  log.debug(
    "[ChangePool] Done! oldPoolIndexInputTokens = {} oldPoolIndexAssets = {} newPoolIndexInputTokens = {} newPoolIndexAssets = {}",
    [
      oldPoolIndexInputTokens.toString(),
      oldPoolIndexAssets.toString(),
      newPoolIndexInputTokens.toString(),
      newPoolIndexAssets.toString(),
    ],
  );

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

    let newSwapVolumeTokenAmount = removeFromArrayAtIndex(
      oldPoolHourlySnapshot.hourlyVolumeByTokenAmount,
      oldPoolIndexInputTokens,
    );

    let newSwapVolumeUSD = removeFromArrayAtIndex(
      oldPoolHourlySnapshot.hourlyVolumeByTokenUSD,
      oldPoolIndexInputTokens,
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

    let newSwapVolumeTokenAmount = removeFromArrayAtIndex(
      oldPoolDailySnapshot.dailyVolumeByTokenAmount,
      oldPoolIndexInputTokens,
    );

    let newSwapVolumeUSD = removeFromArrayAtIndex(oldPoolDailySnapshot.dailyVolumeByTokenUSD, oldPoolIndexInputTokens);

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

    let newSwapVolumeTokenAmount = addToArrayAtIndex(
      newPoolHourlySnapshot.hourlyVolumeByTokenAmount,
      BIGINT_ZERO,
      newPoolIndexInputTokens,
    );

    let newSwapVolumeUSD = addToArrayAtIndex(
      newPoolHourlySnapshot.hourlyVolumeByTokenUSD,
      BIGDECIMAL_ZERO,
      newPoolIndexInputTokens,
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

    let newSwapVolumeTokenAmount = addToArrayAtIndex(
      newPoolDailySnapshot.dailyVolumeByTokenAmount,
      BIGINT_ZERO,
      newPoolIndexInputTokens,
    );

    let newSwapVolumeUSD = addToArrayAtIndex(
      newPoolDailySnapshot.dailyVolumeByTokenUSD,
      BIGDECIMAL_ZERO,
      newPoolIndexInputTokens,
    );

    newPoolDailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    newPoolDailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    newPoolDailySnapshot.save();

    log.debug("[ChangePool] newPoolDailySnapshot newAMT {} newUSD {}", [
      newPoolDailySnapshot.dailyVolumeByTokenAmount.toString(),
      newPoolDailySnapshot.dailyVolumeByTokenUSD.toString(),
    ]);
  }
}

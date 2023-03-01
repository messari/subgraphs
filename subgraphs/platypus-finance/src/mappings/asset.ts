// Asset is the LP token for each Token that is added to a pool

import { PoolUpdated, CashAdded, CashRemoved } from "../../generated/templates/Asset/Asset";
import { Address, log } from "@graphprotocol/graph-ts";
import { LiquidityPool, _Asset, _LiquidityPoolAssetTokenHelper } from "../../generated/schema";
import { updateProtocolTVL } from "../common/metrics";
import { getOrCreateDexAmm, getOrCreateToken, getTokenHelperId } from "../common/getters";
import { poolDetail, ZERO_ADDRESS } from "../common/constants";

export function handleCashAdded(event: CashAdded): void {
  const _asset = _Asset.load(event.address.toHexString())!;
  _asset.cash = _asset.cash.plus(event.params.cashBeingAdded);
  _asset.save();
  updateProtocolTVL(event, event.address);
}

export function handleCashRemoved(event: CashRemoved): void {
  const _asset = _Asset.load(event.address.toHexString())!;
  _asset.cash = _asset.cash.minus(event.params.cashBeingRemoved);
  _asset.save();
  updateProtocolTVL(event, event.address);
}

export function handlePoolUpdated(event: PoolUpdated): void {
  log.debug("[{}][ChangePool] for asset {} from {} to {}", [
    event.transaction.hash.toHexString(),
    event.address.toHexString(),
    event.params.previousPool.toHexString(),
    event.params.newPool.toHexString(),
  ]);

  const _asset = _Asset.load(event.address.toHexString())!;
  const detail: poolDetail = poolDetail.fromAddress(event.params.newPool.toHexString());
  const assetPool = LiquidityPool.load(event.address.toHexString())!;
  const token = getOrCreateToken(event, Address.fromString(_asset.token));

  if (assetPool._ignore && !detail.ignore) {
    const protocol = getOrCreateDexAmm();
    protocol.totalPoolCount = protocol.totalPoolCount - 1;
    protocol.save();
  } else if (!assetPool._ignore && detail.ignore) {
    const protocol = getOrCreateDexAmm();
    protocol.totalPoolCount = protocol.totalPoolCount + 1;
    protocol.save();
  }

  assetPool.poolAddress = event.params.newPool.toHexString();
  assetPool._ignore = detail.ignore;
  assetPool.name = token.symbol.concat(" on ").concat(detail.name);
  assetPool.symbol = token.symbol.concat("-").concat(detail.symbol);
  assetPool.save();

  if (!event.params.previousPool.equals(ZERO_ADDRESS)) {
    const helper = _LiquidityPoolAssetTokenHelper.load(
      getTokenHelperId(event.params.previousPool, Address.fromString(_asset.token)),
    )!;
    log.debug("[{}][ChangePool] from helper id {}", [event.transaction.hash.toHexString(), helper.id]);
    helper.id = getTokenHelperId(event.params.newPool, Address.fromString(_asset.token));
    helper.save();
    log.debug("[{}][ChangePool] to helper id {}", [event.transaction.hash.toHexString(), helper.id]);
  }
  updateProtocolTVL(event, ZERO_ADDRESS);
}

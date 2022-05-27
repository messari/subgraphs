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
  // Fetch old liq pool
  // Remove from old liq pool
  // Remove from old Liq Pool - Daily Snapshot
  // Remove from old Liq Pool - Hourly Snapshot
  // Fetch new liq pool
  // Add to new pool
  // Add to New Liq Pool - Daily Snapshot
  // Add to New Liq Pool - Hourly Snapshot
  // UpdateTVL
}

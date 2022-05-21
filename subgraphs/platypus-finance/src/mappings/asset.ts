// Asset is the LP token for each Token that is added to a pool

import { Transfer, MaxSupplyUpdated, PoolUpdated } from "../../generated/templates/Asset/Asset";
import { Address } from "@graphprotocol/graph-ts";

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

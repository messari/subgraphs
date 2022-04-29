// Asset is the LP token for each Token that is added to a pool

import { Transfer, MaxSupplyUpdated, PoolUpdated } from "../../generated/templates/Asset/Asset";

export function handleTransfer(event: Transfer): void {
    // noop
}
export function handleMaxSupplyUpdated(event: MaxSupplyUpdated): void {
    // noop
}
export function handlePoolUpdated(event: PoolUpdated): void {
    // Fetch old liq pool
    // Remove from old liq pool
    // Fetch new liq pool
    // Add to new pool
    // UpdateTVL

}

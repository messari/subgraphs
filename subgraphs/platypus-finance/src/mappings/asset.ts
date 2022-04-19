// Asset is the LP token for each Token that is added to a pool

import { Transfer, MaxSupplyUpdated, PoolUpdated } from "../../generated/templates/Asset/Asset";

export function handleTransfer(event: Transfer): void {}
export function handleMaxSupplyUpdated(event: MaxSupplyUpdated): void {}
export function handlePoolUpdated(event: PoolUpdated): void {}

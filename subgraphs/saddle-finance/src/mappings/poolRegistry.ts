
import { AddCommunityPool, AddPool, UpdatePool } from "../../generated/Pool Registry/PoolRegistry"
import { createPoolFromRegistryEvent } from "../entities/pool";

export function handleAddPool(event: AddPool): void {
    createPoolFromRegistryEvent(event.params.poolAddress, event.block);
}

export function handleAddCommunityPool(event: AddCommunityPool): void {
    createPoolFromRegistryEvent(event.params.poolAddress, event.block);
}

export function handleUpdatePool(event: UpdatePool): void {
    createPoolFromRegistryEvent(event.params.poolAddress, event.block);
}


import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { PoolAdded, Registry } from "../../generated/Registry/Registry";
import { LiquidityPool } from "../../generated/schema";
import { ADDRESS_ZERO, PoolType, REGISTRY_ADDRESS_V2 } from "../common/constants";
import { getOrCreateToken } from "../common/getters";
import { createNewPool, isLendingPool } from "../services/pool";

function poolExists(poolAddress: Address): boolean {
    let pool = LiquidityPool.load(poolAddress.toHexString());
    if (!pool){
        return false;
    }
    return true;
}

export function handlePoolAdded(event: PoolAdded): void {
    const poolAddress = event.params.pool
    if (poolExists(poolAddress)){
        return;
    }
    const registryContract = Registry.bind(REGISTRY_ADDRESS_V2);
    const lpToken = registryContract.get_lp_token(poolAddress);
    const basePool = registryContract.get_base_pool(poolAddress);
    const lpTokenEntity = getOrCreateToken(lpToken);
    const isLending =  isLendingPool(poolAddress);
    let poolType = isLending ? PoolType.LENDING : PoolType.PLAIN;
    if (!isLending && basePool.equals(ADDRESS_ZERO)){
        poolType = PoolType.BASEPOOL;
    }
    createNewPool(
        poolAddress,
        lpToken,
        lpTokenEntity.name,
        lpTokenEntity.symbol,
        event.block.number,
        event.block.timestamp,
        basePool,
        [],
        poolType
    )
}

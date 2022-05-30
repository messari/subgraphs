import { Address } from "@graphprotocol/graph-ts";
import { BasePoolAdded, MetaPoolDeployed, PlainPoolDeployed } from "../../generated/Factory/Factory";
import { LiquidityPool } from "../../generated/schema";
import { FactoryPools } from "../../generated/templates";
import { ADDRESS_ZERO, PoolType } from "../common/constants";
import { getOrCreateToken } from "../common/getters";
import { createNewPool, getBasePool, getLpToken, isLendingPool } from "../services/pool";

function sortCoins(coins: Address[]): string[] {
  let sorted_coins: string[] = [];
  for (let i = 0; i < coins.length; i++) {
    if (coins[i] !== ADDRESS_ZERO) {
      sorted_coins.push(coins[i].toHexString());
    }
  }
  return sorted_coins;
}

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  const coins = sortCoins(event.params.coins);
  const lp_token = event.params.lp_token;
  const lpTokenEntity = getOrCreateToken(lp_token);
  let pool = event.params.pool;
  createNewPool(
    pool,
    lp_token,
    lpTokenEntity.name,
    lpTokenEntity.symbol,
    event.block.number,
    event.block.timestamp,
    getBasePool(pool),
    coins,
  );
  // Create a new pool
  FactoryPools.create(pool);
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  const coins = sortCoins(event.params.coins);
  let lp_token = event.params.lp_token;
  const lpTokenEntity = getOrCreateToken(lp_token);
  let pool = event.params.pool;
  createNewPool(
    pool,
    lp_token,
    lpTokenEntity.name,
    lpTokenEntity.symbol,
    event.block.number,
    event.block.timestamp,
    event.params.base_pool,
    coins,
    PoolType.METAPOOL,
  );
  // Create a new pool
  FactoryPools.create(pool);
}

export function handleBasePoolAdded(event: BasePoolAdded): void {
  let pool = LiquidityPool.load(event.params.base_pool.toHexString());
  if (!pool) {
    let lpTokenEntity = getOrCreateToken(getLpToken(event.params.base_pool));
    createNewPool(
      event.params.base_pool,
      Address.fromString(lpTokenEntity.id),
      lpTokenEntity.name,
      lpTokenEntity.symbol,
      event.block.number,
      event.block.timestamp,
      getBasePool(event.params.base_pool),
      [],
      isLendingPool(event.params.base_pool) ? PoolType.LENDING : PoolType.BASEPOOL,
    );
  }
}

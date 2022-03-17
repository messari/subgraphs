import {
  Address,
  store,
  ethereum,
} from "@graphprotocol/graph-ts";

import {
  Registry,
  PoolAdded,
  PoolRemoved
} from "../../generated/MainRegistry/Registry";

import { StableSwap } from "../../generated/MainRegistry/StableSwap";

import { LiquidityPool, Token } from "../../generated/schema";
import { getOrNull, REGISTRY_ADDRESS } from "../utils/constant";

import { getOrCreatePool, createDexAmmProtocol } from "../utils/pool";
import { getOrCreateToken } from "../utils/tokens";

export function handlePoolAdded(event: PoolAdded): void {
  let poolAddress = event.params.pool

  let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));
  let poolContract = StableSwap.bind(poolAddress);

  // Input tokens
  let coins: Address[] | null = getOrNull<Address[]>(
    registryContract.try_get_coins(poolContract._address)
  );
  let inputTokens = coins ? coins.map<Token>((coin) => getOrCreateToken(coin, event)) : [];

  // Get Output tokens
    let lpToken = registryContract.get_lp_token(poolAddress);
    let outputToken = getOrCreateToken(lpToken, event)
    

  // Create a new pool
  let pool = getOrCreatePool(
    event,
    poolAddress,
    REGISTRY_ADDRESS,
    inputTokens,
    outputToken,
    []
  );

  createDexAmmProtocol(pool)
}

export function handlePoolRemoved(event: PoolRemoved): void {
  // Remove existing pool
  removePool(event.params.pool, event);
}

function removePool(address: Address, event: ethereum.Event): void {
  let id = address.toHexString();
  // Check if pool exist
  let pool = LiquidityPool.load(id);

  // If pool exist, remove it from storage
  if (pool != null) {
    store.remove(pool.id, id);
  }
}

import {
  Address,
  store,
  ethereum,
  dataSource,
} from "@graphprotocol/graph-ts";

import {
  Registry,
  PoolAdded,
  PoolRemoved
} from "../../generated/MainRegistry/Registry";

import { StableSwap } from "../../generated/MainRegistry/StableSwap";
import { Pool as PoolDataSource } from '../../generated/templates'

import { DexAmmProtocol, LiquidityPool, Token } from "../../generated/schema";
import { getOrNull, Network, ProtocolType, REGISTRY_ADDRESS } from "../utils/constant";

import { getOrCreatePool } from "../utils/pool";
import { getOrCreateToken } from "../utils/tokens";

export function getOrCreateProtocol(): DexAmmProtocol {
  let id = dataSource.address().toHexString()
  let protocol = DexAmmProtocol.load(id)
  if(!protocol) {
    protocol = new DexAmmProtocol(id)
    protocol.name = "curve finance"
    protocol.slug = "curve-finance"
    protocol.network = Network.ETHEREUM
    protocol.type = ProtocolType.EXCHANGE

    protocol.save()

    return protocol as DexAmmProtocol
  }
  return protocol as DexAmmProtocol
}

export function handlePoolAdded(event: PoolAdded): void {
  let protocol = getOrCreateProtocol()
  let poolAddress = event.params.pool

  let registryContract = Registry.bind(dataSource.address());
  let poolContract = StableSwap.bind(poolAddress);

  registryContract
  // Input tokens
  let coins: Address[] | null = getOrNull<Address[]>(
    registryContract.try_get_coins(poolAddress)
  );
  let inputTokens = coins ? coins.map<Token>(coin => getOrCreateToken(coin)) : [];

  // Get Output tokens
  let lpToken = registryContract.try_get_lp_token(poolAddress);
  if(!lpToken.reverted) {
    let outputToken = getOrCreateToken(lpToken.value)
    // Create a new pool
    let pool = getOrCreatePool(
      event,
      poolAddress,
      protocol.id,
      inputTokens,
      outputToken,
      []
    );
    PoolDataSource.create(poolAddress)
  }
  // Start indexing events from new pool
  // let context = new DataSourceContext()
  // context.setBytes('registry', registryContract._address)

}

export function handlePoolRemoved(event: PoolRemoved): void {
  // Remove existing pool
  removePool(event.params.pool, event);
}

function removePool(address: Address, event: ethereum.Event): void {
  // let id = address.toHexString();
  // // Check if pool exist
  // let pool = LiquidityPool.load(id);

  // // If pool exist, remove it from storage
  // if (pool != null) {
  //   store.remove(pool.id, id);
  // }
}

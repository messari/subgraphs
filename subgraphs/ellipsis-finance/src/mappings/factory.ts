import { Address } from "@graphprotocol/graph-ts";
import {
  MetaPoolDeployed,
  PlainPoolDeployed,
} from "../../generated/Factory/Factory";
import { FactoryPools } from "../../generated/templates";
import {
  getOrCreatePool,
} from "../helpers/pool/createPool";
import { ZERO_ADDRESS } from "../utils/constant";

export function handlePlainPoolDeployed(event: PlainPoolDeployed): void {
  let coins = event.params.coins;
  let fee = event.params.fee;
  let lp_token = event.params.lp_token;
  let pool = event.params.pool;

  let sorted_coins: Address[] = []
  for(let i = 0; i < coins.length; i++) {
    if(coins[i] !== Address.fromString(ZERO_ADDRESS)) {
      sorted_coins.push(coins[i])
    }
  }

  // Create a new pool
  getOrCreatePool(
    event,
    sorted_coins,
    lp_token,
    pool
  );
  FactoryPools.create(pool);
}

export function handleMetaPoolDeployed(event: MetaPoolDeployed): void {
  let coins = event.params.coins;
  let lp_token = event.params.lp_token;
  let pool = event.params.pool;

  let sorted_coins: Address[] = []
  for(let i = 0; i < coins.length; i++) {
    if(coins[i] !== Address.fromString(ZERO_ADDRESS)) {
      sorted_coins.push(coins[i])
    }
  }

  // Create a new pool
  getOrCreatePool(
    event,
    coins,
    lp_token,
    pool
  );

  FactoryPools.create(pool);
}

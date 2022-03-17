import {
  Address,
  BigDecimal,
  DataSourceContext,
  ethereum,
} from "@graphprotocol/graph-ts";

import { Registry } from "../../generated/MainRegistry/Registry";

import { StableSwap } from "../../generated/MainRegistry/StableSwap";
import { ERC20 } from "../../generated/MainRegistry/ERC20";
import { Pool as PoolDataSource } from "../../generated/templates";

import { LiquidityPool, Token, DexAmmProtocol } from "../../generated/schema";

import { getOrCreateToken } from "../utils/tokens";

import {
  BIGDECIMAL_ZERO,
  REGISTRY_ADDRESS,
  getOrNull,
} from "../utils/constant";

// Create new pool
export function getOrCreatePool(
  event: ethereum.Event,
  address: Address,
  protocol: string,
  inputTokens: Token[],
  outputToken: Token,
  rewardTokens: Token[]
): LiquidityPool {
  // Check if pool exist
  let pool = LiquidityPool.load(address.toString());

  // If pool doesn't exist, create a new pool
  if (pool == null) {
    let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));

    let inputTokenBalances: BigDecimal[] = []
    for(let i = 0; i < inputTokens.length; i++) {
        inputTokenBalances.push(BIGDECIMAL_ZERO)
    }

    pool = new LiquidityPool(address.toString());
    pool.protocol = protocol;
    pool.inputTokens = inputTokens.map<string>((t) => t.id);
    pool.outputToken = outputToken.id;
    pool.rewardTokens = rewardTokens.map<string>((t) => t.id);
    pool.inputTokenBalances = inputTokenBalances.map<BigDecimal>((tb) => tb);
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = [];
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.createdTimestamp = event.block.timestamp;
    pool.createdBlockNumber = event.block.number;
    pool.name = registryContract.get_pool_name(address);
    pool.symbol = null;

    pool.save();

    return pool!;
  }

  // Return pool if it already exist
  return pool!;
}

export function updatePool(
    event: ethereum.Event,
    pool: LiquidityPool,
    balances: BigDecimal[],
    totalSupply: BigDecimal
): LiquidityPool {
    // createPoolSnapshot(event, pool);

    pool.inputTokenBalances = balances.map<BigDecimal>(tb => tb);
    pool.outputTokenSupply = totalSupply;
    pool.createdTimestamp = event.block.timestamp
    pool.createdBlockNumber = event.block.number
    pool.save();

    return pool!
}

// TODO: Update the DexAmm function
export function createDexAmmProtocol(pool: LiquidityPool): void {}

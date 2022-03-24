import {
  Address,
  BigDecimal,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { Registry } from "../../generated/Factory/Registry";
import { StableSwap } from "../../generated/Factory/StableSwap";
import { BasePool, LiquidityPool, Token } from "../../generated/schema";
import { Pool } from "../../generated/templates";
import { getOrCreateProtocol } from "../utils/common";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  PoolType,
  REGISTRY_ADDRESS,
  ZERO_ADDRESS,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";
import { saveCoin } from "./coin";
import { createPoolDailySnapshot } from "./poolDailySnapshot";

// Create New Base Pool
export function getOrCreateBasePool(basePoolAddress: Address): BasePool {
  let id = basePoolAddress.toHexString();
  let basePool = BasePool.load(id);
  if (basePool == null) {
    basePool = new BasePool(id);
    basePool.address = basePoolAddress;

    basePool.save();

    return basePool;
  }
  return basePool;
}

// Create new pool
export function CreatePool(
  call: ethereum.Call,
  poolAddress: Address,
  name: string,
  symbol: string,
  poolType: string
): void {
  let protocol = getOrCreateProtocol();
  let factoryContract = Factory.bind(Address.fromString(protocol.id));
  let registryContract = Registry.bind(Address.fromString(REGISTRY_ADDRESS));
  let poolContract = StableSwap.bind(poolAddress);
  let timestamp = call.block.timestamp;
  let blockNumber = call.block.number;
  let transactionhash = call.transaction.hash;
  // Check if pool exist
  let pool = LiquidityPool.load(poolAddress.toHexString());
  let getCoinCount = factoryContract.try_get_n_coins(poolAddress);
  let coinCount: BigInt = getCoinCount.reverted
    ? BIGINT_ZERO
    : getCoinCount.value;
  // If pool doesn't exist, create a new pool
  if (pool == null) {
    pool = new LiquidityPool(poolAddress.toHexString());
    pool.protocol = protocol.id;
    pool._factoryAddress = factoryContract._address;
    pool._swapAddress = poolContract._address;
    pool._coinCount = coinCount;
    let getBasePool = factoryContract.try_get_base_pool(poolAddress);
    let basePool = getBasePool.reverted
      ? Address.fromString(ZERO_ADDRESS)
      : getBasePool.value;
    pool._basePool = getOrCreateBasePool(basePool).id;

    let tryUnderlyingCoinCount = registryContract.try_get_n_coins(
      Address.fromBytes(pool._swapAddress)
    );
    let getUnderlyingCoinCount: BigInt[] = tryUnderlyingCoinCount.reverted
      ? []
      : tryUnderlyingCoinCount.value;
    let underlyingCoinCount = getUnderlyingCoinCount[1];

    pool._underlyingCount = underlyingCoinCount;

    // Input tokens
    let getCoins = factoryContract.try_get_coins(poolAddress);
    let coins: Address[] = getCoins.reverted ? [] : getCoins.value;

    let inputTokens: Token[] = [];
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let token = getOrCreateToken(coins[i]);
      inputTokens.push(token);
    }

    // Get Output tokens
    let _lpTokenAddress = poolAddress;
    let outputToken = getOrCreateToken(_lpTokenAddress).id;

    let inputTokenBalances: BigDecimal[] = [];
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      inputTokenBalances.push(BIGDECIMAL_ZERO);
    }

    pool.inputTokens = inputTokens.map<string>((t) => t.id);
    pool.outputToken = outputToken;
    pool.rewardTokens = [];
    pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    pool.totalVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = inputTokenBalances.map<BigDecimal>((tb) => tb);
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    pool.createdTimestamp = call.block.timestamp;
    pool.createdBlockNumber = call.block.number;
    pool.name = name;
    pool.symbol = symbol;
    pool._lpTokenAddress = _lpTokenAddress;
    pool._poolType = poolType;

    saveCoin(pool, timestamp, blockNumber, transactionhash);

    pool.save();
  }
}

export function updatePool(
  event: ethereum.Event,
  pool: LiquidityPool,
  balances: BigDecimal[],
  totalSupply: BigDecimal,
  outputTokenPriceUSD: BigDecimal,
  totalVolumeUSD: BigDecimal,
  totalValueLockedUSD: BigDecimal
): LiquidityPool {
  createPoolDailySnapshot(event, pool);

  pool.inputTokenBalances = balances.map<BigDecimal>((tb) => tb);
  pool.outputTokenSupply = totalSupply;
  pool.outputTokenPriceUSD = outputTokenPriceUSD;
  pool.totalValueLockedUSD = totalValueLockedUSD;
  pool.totalVolumeUSD = totalVolumeUSD;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.save();

  return pool as LiquidityPool;
}

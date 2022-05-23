import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { StableSwap } from "../../generated/Factory/StableSwap";
import { LiquidityPool, LptokenPool } from "../../generated/schema";
import {
  ADDRESS_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  PoolType,
  POOL_LP_TOKEN_MAP,
  REGISTRY_ADDRESS,
  ZERO_ADDRESS,
} from "../common/constants";
import { getOrCreateToken } from "../common/getters";
import { setLpTokenPool, setPoolBalances, setPoolFees, setPoolOutputTokenSupply, setPoolTVL, setProtocolTVL } from "../common/setters";
import { getPlatform } from "./platform";
import { getLpTokenPriceUSD } from "./snapshots";

export function createNewPool(
  poolAddress: Address,
  lpToken: Address,
  name: string,
  symbol: string,
  block: BigInt,
  timestamp: BigInt,
  basePool: Address,
  coins: string[],
  poolType: string = PoolType.PLAIN,
): LiquidityPool {
  log.error("createNewPool {}", [poolAddress.toHexString()]);
  const platform = getPlatform();
  const pools = platform.poolAddresses;
  pools.push(poolAddress.toHexString());
  platform.poolAddresses = pools;
  platform.save();
  const pool = new LiquidityPool(poolAddress.toHexString());
  const stableSwap = StableSwap.bind(poolAddress);
  pool.name = name;
  pool.platform = platform.id;
  pool.outputToken = getOrCreateToken(lpToken).id;
  pool.symbol = symbol;
  pool.isV2 = stableSwap.try_future_offpeg_fee_multiplier().reverted ? false : true;
  pool.createdBlockNumber = block;
  pool.createdTimestamp = timestamp;
  pool.basePool = basePool.toHexString();
  pool.outputTokenPriceUSD = getLpTokenPriceUSD(pool, timestamp);
  pool.inputTokens = coins.length > 0 ? coins.sort() : getPoolCoins(pool).sort();
  pool.coins = coins.length > 0 ? coins.sort() : getPoolCoins(pool).sort();
  pool.underlyingTokens = getUnderlyingTokens(pool);
  pool.poolType = poolType;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  setPoolBalances(pool);
  setPoolTVL(pool, timestamp);
  setPoolFees(pool);
  setPoolOutputTokenSupply(pool);
  pool.save();
  setProtocolTVL();
  setLpTokenPool(lpToken,poolAddress)
  return pool;
}

export function getLpToken(pool: Address): Address {
  let stableSwap = StableSwap.bind(pool);
  let lpToken = ADDRESS_ZERO
  let lpTokenCall = stableSwap.try_lp_token();
  if (lpTokenCall.reverted) {
    const poolAddress = pool.toHexString().toLowerCase();
    if (POOL_LP_TOKEN_MAP.has(poolAddress)){
      lpToken = POOL_LP_TOKEN_MAP.get(poolAddress);
    } else{
      log.error('cannot find lptoken for pool {}',[pool.toHexString()]);
    }
  } else {
    lpToken = lpTokenCall.value;
  }
  return lpToken;
}

export function getBasePool(pool: Address): Address {
  let stableSwap = StableSwap.bind(pool);
  let basePoolCall = stableSwap.try_base_pool();
  if (!basePoolCall.reverted) {
    return basePoolCall.value;
  }
  const registry = Factory.bind(REGISTRY_ADDRESS);
  basePoolCall = registry.try_get_base_pool(pool);
  if (!basePoolCall.reverted) {
    return basePoolCall.value;
  }
  return Address.fromString("0x0000000000000000000000000000000000000000");
}

export function getWrappedCoins(curvePool: StableSwap): string[] {
  let wrappedCoins: string[] = [];
  let i = BIGINT_ZERO;
  let wrappedCoinCall = curvePool.try_wrapped_coins(i);
  while (!wrappedCoinCall.reverted) {
    wrappedCoins.push(wrappedCoinCall.value.toHexString());
    i = i.plus(BIGINT_ONE);
    wrappedCoinCall = curvePool.try_wrapped_coins(i);
  }
  return wrappedCoins;
}

export function getPoolCoins(pool: LiquidityPool): string[] {
  const curvePool = StableSwap.bind(Address.fromString(pool.id));
  if (!curvePool.try_wrapped_coins(BIGINT_ZERO).reverted) {
    return getWrappedCoins(curvePool);
  }
  let inputTokens = pool.inputTokens;
  if (inputTokens.length > 0) {
    return inputTokens;
  }
  let i = 0;
  let coinResult = curvePool.try_coins(BigInt.fromI32(i));
  if (coinResult.reverted) {
    return [];
  }
  while (!coinResult.reverted) {
    inputTokens.push(getOrCreateToken(coinResult.value).id);
    i += 1;
    coinResult = curvePool.try_coins(BigInt.fromI32(i));
  }
  return inputTokens;
}

export function getBasePoolCoins(pool: LiquidityPool): string[] {
  const underlyingTokens = pool.underlyingTokens;
  if (pool.basePool == ZERO_ADDRESS) {
    return [];
  }
  const basePoolEntity = LiquidityPool.load(pool.basePool);
  if (basePoolEntity) {
    return getPoolCoins(basePoolEntity);
  }
  if (!basePoolEntity) {
    log.error("basePoolEntity not found for {}", [pool.basePool]);
  }
  const curvePool = StableSwap.bind(Address.fromString(pool.id));
  let i = BIGINT_ZERO;
  let basePoolCoinsCall = curvePool.try_base_coins(i);
  while (!basePoolCoinsCall.reverted) {
    underlyingTokens.push(basePoolCoinsCall.value.toHexString());
    basePoolCoinsCall = curvePool.try_base_coins(i);
    i = i.plus(BIGINT_ONE);
  }
  return underlyingTokens;
}

export function getUnderlyingTokens(pool: LiquidityPool): string[] {
  const curvePool = StableSwap.bind(Address.fromString(pool.id));
  let underlyingTokens = pool.underlyingTokens;
  let i = 0;
  if (!curvePool.try_wrapped_coins(BIGINT_ZERO).reverted) {
    let coinResult = curvePool.try_coins(BigInt.fromI32(i));
    if (coinResult.reverted) {
      return [];
    }
    while (!coinResult.reverted) {
      underlyingTokens.push(coinResult.value.toHexString());
      i += 1;
      coinResult = curvePool.try_coins(BigInt.fromI32(i));
    }
  }
  if (underlyingTokens.length == 0) {
    return getBasePoolCoins(pool);
  }
  return underlyingTokens;
}

export function getPoolCoinsFromAddress(pool: Address): string[] {
  const curvePool = StableSwap.bind(pool);
  if (!curvePool.try_wrapped_coins(BIGINT_ZERO).reverted) {
    return getWrappedCoins(curvePool);
  }
  let inputTokens: string[] = [];
  let i = 0;
  let coinResult = curvePool.try_coins(BigInt.fromI32(i));
  if (coinResult.reverted) {
    return [];
  }
  while (!coinResult.reverted) {
    inputTokens.push(getOrCreateToken(coinResult.value).id);
    i += 1;
    coinResult = curvePool.try_coins(BigInt.fromI32(i));
  }
  return inputTokens;
}

export function isLendingPool(pool: Address): boolean {
  let curvePool = StableSwap.bind(pool);
  let lendingPoolCall = curvePool.try_wrapped_coins(BIGINT_ZERO);
  return lendingPoolCall.reverted ? false : true;
}

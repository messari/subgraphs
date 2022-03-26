import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { StableSwapLending3 } from "../../generated/templates/PoolLPToken/StableSwapLending3";
import { StableSwapLending2_v1 } from "../../generated/templates/PoolLPToken/StableSwapLending2_v1";
import { StableSwapPlain3 } from "../../generated/templates/PoolLPToken/StableSwapPlain3";
import { Factory } from "../../generated/Factory/Factory";
import { Registry } from "../../generated/Factory/Registry";
import { StableSwap } from "../../generated/Factory/StableSwap";
import { BasePool, LiquidityPool, Token } from "../../generated/schema";
import { getOrCreateProtocol } from "../utils/common";
import {
  addressToPool,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  lpTokenToPool,
  PoolStaticInfo,
  PoolType,
  REGISTRY_ADDRESS,
  ZERO_ADDRESS,
} from "../utils/constant";
import { getOrCreateToken } from "../utils/tokens";
import { saveCoin } from "./coin";
import { createPoolDailySnapshot } from "./poolDailySnapshot";

class PoolInfo {
  coins: Address[];
  underlyingCoins: Address[];
  balances: BigInt[];
}

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
export function CreatePoolFromFactory(
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

    let inputTokenBalances: BigInt[] = [];
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      inputTokenBalances.push(BIGINT_ZERO);
    }

    pool.inputTokens = inputTokens.map<string>((t) => t.id);
    pool.outputToken = outputToken;
    pool.rewardTokens = [];
    // pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
    // pool.totalVolumeUSD = BIGDECIMAL_ZERO;
    pool.inputTokenBalances = inputTokenBalances.map<BigInt>((tb) => tb);
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    // pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
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

export function getOrCreatePoolFromTemplate(
  event: ethereum.Event, 
  address: Address
): LiquidityPool {
  let pool = LiquidityPool.load(address.toHexString());

  if (pool == null) {
    let staticInfo: PoolStaticInfo = addressToPool.get(address.toHexString()) as PoolStaticInfo;
    let contractInfo: PoolInfo = getPoolInfo(address);
    let protocol = getOrCreateProtocol();
  let factoryContract = Factory.bind(Address.fromString(protocol.id));
  let poolContract = StableSwap.bind(address);

    pool = new LiquidityPool(address.toHexString());
    pool._coinCount = BigInt.fromI32(contractInfo.coins.length);
    pool._swapAddress = poolContract._address;
    let getBasePool = factoryContract.try_get_base_pool(Address.fromString(staticInfo.poolAddress));
      let basePool = getBasePool.reverted
        ? Address.fromString(ZERO_ADDRESS)
        : getBasePool.value;
      pool._basePool = getOrCreateBasePool(basePool).id;
    
    let inputTokens: Token[] = [];
    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let coin = contractInfo.coins[i];
      let token = getOrCreateToken(coin);
      inputTokens.push(token);
    }
    pool.inputTokens = inputTokens.map<string>((t) => t.id);
    pool._underlyingCount = BigInt.fromI32(contractInfo.underlyingCoins.length)

    pool.inputTokenBalances = contractInfo.balances;
    pool.outputTokenSupply = BIGDECIMAL_ZERO;
    let lpToken = getOrCreateToken(Address.fromString(staticInfo.lpTokenAddress));
    pool.outputToken = lpToken.id;

    pool.createdBlockNumber = event.block.number;
    pool.createdTimestamp = event.block.timestamp;
    
    let poolRewardTokens: Token[] = [];
    for (let i = 0; i < staticInfo.rewardTokens.length; i++) {
      let coin = Address.fromString(staticInfo.rewardTokens[i]);
      let token = getOrCreateToken(coin);
      poolRewardTokens.push(token);
    }
    pool._lpTokenAddress = Address.fromString(staticInfo.lpTokenAddress)
    pool.rewardTokens = poolRewardTokens.map<string>(t => t.id)
    pool._poolType = staticInfo.poolType

    saveCoin(pool, pool.createdTimestamp, pool.createdBlockNumber, event.transaction.hash);
    
    pool.save();
    
  }

  return pool as LiquidityPool;
}

export function getPoolInfo(pool: Address): PoolInfo {
  let staticInfo: PoolStaticInfo = addressToPool.get(pool.toHexString()) as PoolStaticInfo;

  let coins: Address[] = [];
  let balances: BigInt[] = [];
  let underlyingCoins: Address[] = [];

  let c: ethereum.CallResult<Address>;
  let b: ethereum.CallResult<BigInt>;
  let u: ethereum.CallResult<Address>;

  // old contracts use int128 as input to balances, new contracts use uint256
  if (staticInfo.is_v1) {
    let contract_v1 = StableSwapLending2_v1.bind(pool);

    for (let i = 0; i < staticInfo.coinCount; ++i) {
      let ib = BigInt.fromI32(i);
      c = contract_v1.try_coins(ib);
      b = contract_v1.try_balances(ib);

      if (!c.reverted && c.value.toHexString() != ZERO_ADDRESS && !b.reverted) {
        coins.push(c.value);
        balances.push(b.value);
      }

      if (staticInfo.poolType == PoolType.LENDING) {
        u = contract_v1.try_underlying_coins(ib);
        if (!u.reverted) {
          underlyingCoins.push(u.value);
        }
      }
    }
  } else {
    let contract = StableSwapLending3.bind(pool);
    for (let i = 0; i < staticInfo.coinCount; ++i) {
      let ib = BigInt.fromI32(i);
      c = contract.try_coins(ib);
      b = contract.try_balances(ib);

      if (!c.reverted && c.value.toHexString() != ZERO_ADDRESS && !b.reverted) {
        coins.push(c.value);
        balances.push(b.value);
      }

      if (staticInfo.poolType == PoolType.LENDING) {
        u = contract.try_underlying_coins(ib);
        if (!u.reverted) {
          underlyingCoins.push(u.value);
        }
      }
    }
  }

  return {
    coins,
    underlyingCoins,
    balances,
  };
}


export function updatePool(
  event: ethereum.Event,
  pool: LiquidityPool,
  balances: BigInt[],
  totalSupply: BigDecimal,
  // outputTokenPriceUSD: BigDecimal,
  // totalVolumeUSD: BigDecimal,
  // totalValueLockedUSD: BigDecimal
): LiquidityPool {
  createPoolDailySnapshot(event, pool);

  pool.inputTokenBalances = balances.map<BigInt>((tb) => tb);
  pool.outputTokenSupply = totalSupply;
  // pool.outputTokenPriceUSD = outputTokenPriceUSD;
  // pool.totalValueLockedUSD = totalValueLockedUSD;
  // pool.totalVolumeUSD = totalVolumeUSD;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;

  pool.save();

  return pool as LiquidityPool;
}

export function getPoolBalances(pool: LiquidityPool): BigInt[] {
  let balances: BigInt[] = [];
  let b: ethereum.CallResult<BigInt>;

  let p: PoolStaticInfo = addressToPool.get(pool.id) as PoolStaticInfo;

  // old contracts use int128 as input to balances, new contracts use uint256
  if (p.is_v1) {
    let contract_v1 = StableSwapLending2_v1.bind(Address.fromString(pool.id));

    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let ib = BigInt.fromI32(i);
      b = contract_v1.try_balances(ib);
      if (!b.reverted) {
        balances.push(b.value);
      }
    }
  } else {
    let contract = StableSwapPlain3.bind(Address.fromString(pool.id));

    for (let i = 0; i < pool._coinCount.toI32(); ++i) {
      let ib = BigInt.fromI32(i);
      b = contract.try_balances(ib);
      if (!b.reverted) {
        balances.push(b.value);
      }
    }
  }

  return balances;
}

export function getLpTokenOfPool(pool: Address): Address {
  let p: PoolStaticInfo = addressToPool.get(pool.toHexString()) as PoolStaticInfo;
  let lpTokenAddress = p.lpTokenAddress;

  if (lpTokenAddress == null) {
    return Address.fromString(ZERO_ADDRESS);
  }

  return Address.fromString(lpTokenAddress);
}

export function getPoolFromLpToken(lpToken: Address): Address {
  let poolAddress = lpTokenToPool.get(lpToken.toHexString()) as string;

  if (poolAddress == null) {
    return Address.fromString(ZERO_ADDRESS);
  }

  return Address.fromString(poolAddress);
}


import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";
import { StableSwapLending3 } from "../../../generated/templates/PoolLPToken/StableSwapLending3";
import { StableSwapLending2_v1 } from "../../../generated/templates/PoolLPToken/StableSwapLending2_v1";
import { StableSwapPlain3 } from "../../../generated/templates/PoolLPToken/StableSwapPlain3";
import { Factory } from "../../../generated/Factory/Factory";
import { Registry } from "../../../generated/Factory/Registry";
import { StableSwap } from "../../../generated/Factory/StableSwap";
import { BasePool, LiquidityPool, Token } from "../../../generated/schema";
import { getOrCreateProtocol } from "../../utils/common";
import {
  addressToPool,
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  lpTokenToPool,
  PoolInfo,
  PoolStaticInfo,
  PoolType,
  REGISTRY_ADDRESS,
  ZERO_ADDRESS,
} from "../../utils/constant";
import { getOrCreateToken } from "../../utils/tokens";
import { saveCoin } from "../coin";
import { createPoolDailySnapshot } from "../poolDailySnapshot";
import { getPoolInfo } from "./getPoolInfo";


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
      Address.fromString(pool.id)
    );
    let getUnderlyingCoinCount: BigInt[] = tryUnderlyingCoinCount.reverted
      ? []
      : tryUnderlyingCoinCount.value;
    let underlyingCoinCount = getUnderlyingCoinCount[1];

    pool._underlyingCount = underlyingCoinCount;

    let getBalances = factoryContract.try_get_balances(poolAddress);
    let balances: BigInt[] = getBalances.reverted ? [] : getBalances.value;
    
    let getUnderlyingCoins = factoryContract.try_get_underlying_coins(poolAddress);
    let underlyingCoins: Address[] = getUnderlyingCoins.reverted ? [] : getUnderlyingCoins.value;
    
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

    saveCoin(pool, coins, underlyingCoins, balances, timestamp, blockNumber, transactionhash);

    pool.save();
  }
}

export function getOrCreatePoolFromTemplate(
  event: ethereum.Event, 
  address: Address
): LiquidityPool {
  let protocol = getOrCreateProtocol();
  let pool = LiquidityPool.load(address.toHexString());

  if (pool == null) {
    let staticInfo: PoolStaticInfo = addressToPool.get(address.toHexString()) as PoolStaticInfo;
    let contractInfo: PoolInfo = getPoolInfo(address);
  let factoryContract = Factory.bind(Address.fromString(protocol.id));
  // let poolContract = StableSwap.bind(Address.fromString(staticInfo.poolAddress));
    let balances = contractInfo.balances
    let coins = contractInfo.coins
    let underlyingCoins = contractInfo.underlyingCoins

    pool = new LiquidityPool(address.toHexString());
    pool._coinCount = BigInt.fromI32(contractInfo.coins.length);
    pool._swapAddress = Address.fromString(staticInfo.poolAddress);
    let getBasePool = factoryContract.try_get_base_pool(Address.fromString(staticInfo.poolAddress));
      let basePool = getBasePool.reverted
        ? Address.fromString(ZERO_ADDRESS)
        : getBasePool.value;
      pool._basePool = getOrCreateBasePool(basePool).id;

    // Input tokens
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

    pool.save();

    saveCoin(pool, coins, underlyingCoins, balances, pool.createdTimestamp, pool.createdBlockNumber, event.transaction.hash);
    
    
    return pool as LiquidityPool;
  }

  return pool as LiquidityPool;
}











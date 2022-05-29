import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts/index";
import { BasePool, LiquidityPool } from "../../generated/schema";
import { CurvePoolCoin128 } from "../../generated/templates/CurvePoolTemplate/CurvePoolCoin128";
import { CurvePool } from "../../generated/templates/RegistryTemplate/CurvePool";
import {
  ADDRESS_ZERO,
  ASSET_TYPES,
  BIG_INT_ONE,
  CRYPTO_FACTORY,
  METAPOOL_FACTORY,
  METAPOOL_FACTORY_ADDRESS,
  STABLE_FACTORY,
} from "../common/constants/index";
import { CurvePoolTemplate, CurvePoolTemplateV2 } from "../../generated/templates";
import { CurveLendingPool } from "../../generated/templates/CurvePoolTemplate/CurveLendingPool";
import { CurveLendingPoolCoin128 } from "../../generated/templates/CurvePoolTemplate/CurveLendingPoolCoin128";
import { getPlatform } from "./platform";
import { StableFactory } from "../../generated/AddressProvider/StableFactory";
import { getFactory } from "./factory";
import { CryptoFactory } from "../../generated/templates/CryptoRegistryTemplate/CryptoFactory";
import { fetchTokenDecimals } from "../common/tokens";
import { getOrCreateToken, getPoolCoins } from "../common/getters";
import {
  setPoolBalances,
  setPoolFees,
  setPoolOutputTokenSupply,
  setPoolTVL,
  setProtocolTVL,
} from "../common/setters";
import { getLpTokenPriceUSD } from "./snapshots";
import { MainRegistry } from "../../generated/AddressProvider/MainRegistry";
import { setGaugeData } from "./gauges/helpers";

export function checkIfPoolExists(poolId: string): boolean {
  let pool = LiquidityPool.load(poolId);
  if (!pool) {
    return false;
  }
  return true;
}

export function createNewPool(
  poolAddress: Address,
  lpToken: Address,
  name: string,
  symbol: string,
  poolType: string,
  metapool: boolean,
  isV2: boolean,
  block: BigInt,
  timestamp: BigInt,
  basePool: Address,
  gaugeAddress: Address,
  registryAddress: Address,
): void {
  const platform = getPlatform();
  const pools = platform.poolAddresses;
  pools.push(poolAddress.toHexString());
  platform.poolAddresses = pools;
  platform.save();
  const pool = new LiquidityPool(poolAddress.toHexString());
  pool.name = name;
  pool.platform = platform.id;
  pool.outputToken = getOrCreateToken(lpToken).id;
  pool.symbol = symbol;
  pool.metapool = metapool;
  pool.isV2 = isV2;
  pool.createdBlockNumber = block;
  pool.createdTimestamp = timestamp;
  pool.poolType = poolType;
  pool.registry = registryAddress.toHexString();
  pool.assetType = isV2 ? 4 : getAssetType(pool);
  pool.basePool = basePool.toHexString();
  pool.outputTokenPriceUSD = getLpTokenPriceUSD(pool, timestamp);
  pool.gauge = gaugeAddress.toHexString();
  const inputTokens = getPoolCoins(pool);
  pool.coins = inputTokens;
  pool.inputTokens = inputTokens.sort();
  pool.save();
  setPoolBalances(pool);
  setPoolTVL(pool, timestamp);
  setPoolFees(pool);
  setPoolOutputTokenSupply(pool);
  setGaugeData(pool);
  pool.save();
  setProtocolTVL();
}

export function createNewFactoryPool( // @ts-ignore
  version: i32,
  factoryContract: Address,
  metapool: boolean,
  basePool: Address,
  lpToken: Address,
  timestamp: BigInt,
  block: BigInt,
): void {
  let factoryPool: Address;
  let poolType: string;
  const factoryEntity = getFactory(factoryContract, version);
  const poolCount = factoryEntity.poolCount;
  let gauge = ADDRESS_ZERO;
  if (version == 1) {
    const factory = StableFactory.bind(factoryContract);
    poolType = factoryContract == Address.fromString(METAPOOL_FACTORY_ADDRESS) ? METAPOOL_FACTORY : STABLE_FACTORY;
    let factoryPoolCall = factory.try_pool_list(poolCount);
    if (factoryPoolCall.reverted) {
      log.error("factoryPoolCall.reverted for factory {}", [factoryContract.toHexString()]);
      return;
    }
    factoryPool = factoryPoolCall.value;
    let gaugeCall = factory.try_get_gauge(factoryPool);
    if (!gaugeCall.reverted) {
      gauge = gaugeCall.value;
    }
    log.info("New factory pool (metapool: {}) added {} with id {}", [
      metapool.toString(),
      factoryPool.toHexString(),
      poolCount.toString(),
    ]);
  } else {
    const factory = CryptoFactory.bind(factoryContract);
    poolType = CRYPTO_FACTORY;
    let factoryPoolCall = factory.try_pool_list(poolCount);
    if (factoryPoolCall.reverted) {
      log.error("factoryPoolCall.reverted for factory {}", [factoryContract.toHexString()]);
      return;
    }
    factoryPool = factoryPoolCall.value;
    let gaugeCall = factory.try_get_gauge(factoryPool);
    if (!gaugeCall.reverted) {
      gauge = gaugeCall.value;
    }
    log.info("New factory pool added (v2.0) {} with id {}", [factoryPool.toHexString(), poolCount.toString()]);
  }
  factoryEntity.poolCount = factoryEntity.poolCount.plus(BIG_INT_ONE);
  factoryEntity.save();

  let name: string, symbol: string;
  if (version == 2) {
    CurvePoolTemplateV2.create(factoryPool);
    let lpTokenContract = getOrCreateToken(lpToken);
    name = lpTokenContract.name;
    symbol = lpTokenContract.symbol;
  } else {
    CurvePoolTemplate.create(factoryPool);
    const poolContract = CurvePool.bind(factoryPool);
    let nameCall = poolContract.try_name();
    let symbolCall = poolContract.try_symbol();
    name = nameCall.reverted ? "" : nameCall.value;
    symbol = symbolCall.reverted ? "" : symbolCall.value;
  }
  createNewPool(
    factoryPool,
    lpToken == ADDRESS_ZERO ? factoryPool : lpToken,
    name,
    symbol,
    poolType,
    metapool,
    version == 2,
    block,
    timestamp,
    basePool,
    gauge,
    factoryContract,
  );
}

export function createNewRegistryPool(
  poolAddress: Address,
  basePool: Address,
  lpToken: Address,
  metapool: boolean,
  isV2: boolean,
  poolType: string,
  timestamp: BigInt,
  block: BigInt,
  tx: Bytes,
  gauge: Address,
  registryAddress: Address,
): void {
  if (!checkIfPoolExists(poolAddress.toHexString())) {
    log.debug("Non factory pool ({}): {}, lpToken: {}, added to registry at {}", [
      isV2 ? "v2" : "v1",
      poolAddress.toHexString(),
      lpToken.toHexString(),
      tx.toHexString(),
    ]);
    if (!isV2) {
      CurvePoolTemplate.create(poolAddress);
    } else {
      CurvePoolTemplateV2.create(poolAddress);
    }
    let lpTokenContract = getOrCreateToken(lpToken);
    createNewPool(
      poolAddress,
      lpToken,
      lpTokenContract.name,
      lpTokenContract.symbol,
      poolType,
      metapool,
      isV2,
      block,
      timestamp,
      basePool,
      gauge,
      registryAddress,
    );
  } else {
    log.debug("Pool: {} added to the registry at {} but already tracked", [
      poolAddress.toHexString(),
      tx.toHexString(),
    ]);
  }
}

export function getPoolCoins128(pool: BasePool): BasePool {
  const poolContract = CurvePoolCoin128.bind(Address.fromString(pool.id));
  let i = 0;
  const coins = pool.coins;
  const coinDecimals = pool.coinDecimals;
  let coinResult = poolContract.try_coins(BigInt.fromI32(i));
  if (coinResult.reverted) {
    log.warning("Call to int128 coins failed for {}", [pool.id]);
  }
  while (!coinResult.reverted) {
    coins.push(coinResult.value.toHexString());
    coinDecimals.push(BigInt.fromI32(fetchTokenDecimals(coinResult.value)));
    i += 1;
    coinResult = poolContract.try_coins(BigInt.fromI32(i));
  }
  pool.coins = coins;
  pool.coinDecimals = coinDecimals;
  pool.save();
  return pool;
}

export function getBasePool(pool: Address): BasePool {
  let basePool = BasePool.load(pool.toHexString());
  if (!basePool) {
    log.info("Adding new base pool : {}", [pool.toHexString()]);
    basePool = new BasePool(pool.toHexString());
    const poolContract = CurvePool.bind(pool);
    const coins = basePool.coins;
    const coinDecimals = basePool.coinDecimals;
    let i = 0;
    let coinResult = poolContract.try_coins(BigInt.fromI32(i));

    if (coinResult.reverted) {
      // some pools require an int128 for coins and will revert with the
      // regular abi. e.g. 0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714
      log.debug("Call to coins reverted for pool ({}), attempting 128 bytes call", [basePool.id]);
      return getPoolCoins128(basePool);
    }

    while (!coinResult.reverted) {
      coins.push(coinResult.value.toHexString());
      coinDecimals.push(BigInt.fromI32(fetchTokenDecimals(coinResult.value)));
      i += 1;
      coinResult = poolContract.try_coins(BigInt.fromI32(i));
    }
    basePool.coins = coins;
    basePool.coinDecimals = coinDecimals;
    basePool.save();
  }
  return basePool;
}

export function getVirtualBaseLendingPool(pool: Address): BasePool {
  // we're creating fake base pools for lending pools just to have
  // an entity where we can store underlying coins and decimals
  let basePool = BasePool.load(pool.toHexString());
  if (!basePool) {
    log.info("Adding new virtual base lending pool : {}", [pool.toHexString()]);
    basePool = new BasePool(pool.toHexString());
    const poolContract = CurveLendingPool.bind(pool);
    const coins = basePool.coins;
    const coinDecimals = basePool.coinDecimals;
    let i = 0;
    let coinResult = poolContract.try_underlying_coins(BigInt.fromI32(i));

    if (coinResult.reverted) {
      // some lending pools require an int128 for underlying coins
      // e.g. 0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c
      log.debug("Call to coins reverted for pool ({}), attempting 128 bytes call", [basePool.id]);
      const poolContract = CurveLendingPoolCoin128.bind(pool);
      coinResult = poolContract.try_underlying_coins(BigInt.fromI32(i));
      // needs to be repeated because can't assign a CurveLendingPoolCoin128 to
      // poolContract which is CurveLendingPool
      // TODO: see how to get around somehow
      while (!coinResult.reverted) {
        coins.push(coinResult.value.toHexString());
        coinDecimals.push(BigInt.fromI32(fetchTokenDecimals(coinResult.value)));
        i += 1;
        coinResult = poolContract.try_underlying_coins(BigInt.fromI32(i));
      }
      basePool.coins = coins;
      basePool.coinDecimals = coinDecimals;
      basePool.save();
      return basePool;
    }

    while (!coinResult.reverted) {
      coins.push(coinResult.value.toHexString());
      coinDecimals.push(BigInt.fromI32(fetchTokenDecimals(coinResult.value)));
      i += 1;
      coinResult = poolContract.try_underlying_coins(BigInt.fromI32(i));
    }
    basePool.coins = coins;
    basePool.coinDecimals = coinDecimals;
    basePool.save();
  }
  return basePool;
}
// @ts-ignore
export function getAssetTypeCrude(name: string, symbol: string): i32 {
  const description = name.toUpperCase() + "-" + symbol.toUpperCase();
  const stables = ["USD", "DAI", "MIM", "TETHER"];
  for (let i = 0; i < stables.length; i++) {
    if (description.indexOf(stables[i]) >= 0) {
      return 0;
    }
  }

  if (description.indexOf("BTC") >= 0) {
    return 2;
  } else if (description.indexOf("ETH") >= 0) {
    return 1;
  } else {
    return 3;
  }
}
// @ts-ignore
export function getAssetType(pool: LiquidityPool): i32 {
  if (ASSET_TYPES.has(pool.id.toLowerCase())) {
    return ASSET_TYPES.get(pool.id.toLowerCase());
  }
  let registryContract = MainRegistry.bind(Address.fromString(pool.registry));
  let assetTypeCall = registryContract.try_get_pool_asset_type(Address.fromString(pool.id));
  if (!assetTypeCall.reverted) {
    return assetTypeCall.value.toI32();
  }
  return getAssetTypeCrude(pool.name!, pool.symbol!);
}

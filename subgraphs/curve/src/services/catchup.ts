// This is designed to make up for an issue with the way the current main
// registry was added to the address provider. Several pools were registered
// before the registry itself was indexed on the address provider and are
// therefore invisible to the subgraph. We can't backtrack automatically as
// we'd need information that we normally parsed from the event/registry.
// Issue may appear again in the future or on sidechain, so more functions
// might be added in the future.

import { Address, log, Bytes } from "@graphprotocol/graph-ts";
import {
  CATCHUP_BLOCK,
  TRICRYPTO2_POOL_ADDRESS,
  REGISTRY_V2,
  TRYCRYPTO2_POOL_AVAX_GAUGE,
  CATCHUP_LP_TOKENS,
  CATCHUP_START_BLOCKS,
  CATCHUP_START_TIMES,
  CATCHUP_GAUGES,
  CATCHUP_POOL_TYPES,
  CATCHUP_POOLS,
  CURVE_REGISTRY_V1_AVAX,
  CATCHUP_REGISTRIES,
  ADDRESS_ZERO,
  BIG_INT_ONE,
  UNKNOWN_METAPOOLS,
} from "../common/constants/index";
import { createNewFactoryPool, createNewPool } from "./pools";
import { MetaPool } from "../../generated/templates/RegistryTemplate/MetaPool";
import { BigInt } from "@graphprotocol/graph-ts/index";
import { CurvePoolTemplate } from "../../generated/templates";
import { ERC20 } from "../../generated/templates/CurvePoolTemplate/ERC20";
import { StableFactory } from "../../generated/AddressProvider/StableFactory";
import { MainRegistry } from "../../generated/AddressProvider/MainRegistry";
import { CryptoFactory } from "../../generated/templates/CryptoRegistryTemplate/CryptoFactory";
import { Factory, LiquidityPool } from "../../generated/schema";
import { addRegistryPool } from "../mapping";
import { addCryptoRegistryPool } from "../mappingV2";

export function catchUpRegistryMainnet(): void {
  log.info("Catching up registry...", []);
  for (let i = 0; i < CATCHUP_POOLS.length; i++) {
    log.info("Manually adding pool {}", [CATCHUP_POOLS[i].toHexString()]);
    const testMetaPool = MetaPool.bind(CATCHUP_POOLS[i]);
    const testMetaPoolResult = testMetaPool.try_base_pool();
    const lpToken = CATCHUP_LP_TOKENS[i];
    const lpTokenContract = ERC20.bind(lpToken);
    CurvePoolTemplate.create(CATCHUP_POOLS[i]);
    createNewPool(
      CATCHUP_POOLS[i],
      lpToken,
      lpTokenContract.name(),
      lpTokenContract.symbol(),
      CATCHUP_POOL_TYPES[i],
      testMetaPoolResult.reverted,
      false,
      CATCHUP_START_BLOCKS[i],
      CATCHUP_START_TIMES[i],
      testMetaPoolResult.reverted ? CATCHUP_POOLS[i] : testMetaPoolResult.value,
      CATCHUP_GAUGES[i],
      CATCHUP_REGISTRIES[i],
    );
  }
}
/*
export function catchUpAvax(): void {
  const POOLS = [
    Address.fromString("0xF72beaCc6fD334E14a7DDAC25c3ce1Eb8a827E10"),
    Address.fromString("0xb0D2EB3C2cA3c6916FAb8DCbf9d9c165649231AE"),
    Address.fromString("0x065f44cd602cc6680e82e516125839b9bbbbe57e"),
    Address.fromString("0x850c7cc8757ce1fa8ced709f297d842e12e61759"),
    Address.fromString("0xaea2e71b631fa93683bcf256a8689dfa0e094fcd"),
    Address.fromString("0x6041631c566eb8dc6258a75fa5370761d4873990"),
    Address.fromString("0xf92c2a3c91bf869f77f9cb221c5ab1b1ada8a586"),
    Address.fromString("0xe9dcf2d2a17ead11fab8b198578b20535370be6a"),
    Address.fromString("0x30df229cefa463e991e29d42db0bae2e122b2ac7"),
  ];
  for (let i = 0; i < POOLS.length; i++) {
    log.info("Manually adding pool {}", [POOLS[i].toHexString()]);
    const basePool = getAvaxBasePool(POOLS[i]);
    CurvePoolTemplate.create(POOLS[i]);
    createNewFactoryPool(
      1, // version
      Address.fromString("0xb17b674d9c5cb2e441f8e196a2f048a81355d031"), // factory
      basePool==POOLS[i] ? false : true, // is metapool if it has a base pool, otherwise basepool is itself
      getAvaxBasePool(POOLS[i]), // basepool
      POOLS[i], // lptoken
      BigInt.fromI32(1641737222), // start time
      CATCHUP_BLOCK, // start block
    );
  }
  // Adding tricrypto because crypto registry was also added late
  // to address provider
  createNewPool(
    TRICRYPTO2_POOL_ADDRESS,
    Address.fromString("0x1daB6560494B04473A0BE3E7D83CF3Fdf3a51828"),
    "tricrypto",
    "tricrypto",
    REGISTRY_V2,
    false,
    true,
    CATCHUP_BLOCK,
    BigInt.fromI32(1641737222),
    TRICRYPTO2_POOL_ADDRESS,
    TRYCRYPTO2_POOL_AVAX_GAUGE,
    CURVE_REGISTRY_V1_AVAX,
  );
}
*/
function getAvaxBasePool(poolAddress: Address): Address {
  const testMetaPool = MetaPool.bind(poolAddress);
  const testMetaPoolResult = testMetaPool.try_base_pool();
  if (testMetaPoolResult.reverted) {
    const stableFactory = StableFactory.bind(Address.fromString("0xb17b674d9c5cb2e441f8e196a2f048a81355d031"));
    const stableFactoryResult = stableFactory.try_get_base_pool(poolAddress);
    return stableFactoryResult.reverted ? poolAddress : stableFactoryResult.value;
  }
  return testMetaPoolResult.value;
}

export function catchUp(
  registryAddress: Address,
  factory: boolean, // @ts-ignore
  version: i32,
  block: BigInt,
  timestamp: BigInt,
  hash: Bytes,
): void {
  log.info("Adding missing pools on registry {} at block {}", [registryAddress.toHexString(), block.toString()]);
  // ABI should also work for factories since we're only using pool_count/pool_list
  const registry = MainRegistry.bind(registryAddress);
  const cryptoFactory = CryptoFactory.bind(registryAddress);
  const poolCount = registry.try_pool_count();
  if (poolCount.reverted) {
    log.error("Error calling pool count on registry {}", [registryAddress.toHexString()]);
    return;
  }
  log.error("Found {} pools when registry added to address provider", [poolCount.value.toString()]);
  for (let i = 0; i < poolCount.value.toI32(); i++) {
    const poolAddress = registry.try_pool_list(BigInt.fromI32(i));
    if (poolAddress.reverted) {
      log.error("Unable to get pool {} on registry {}", [i.toString(), registryAddress.toHexString()]);
      continue;
    }
    const pool = LiquidityPool.load(poolAddress.value.toHexString());
    if (pool || poolAddress.value == ADDRESS_ZERO) {
      log.warning("Pool {} already exists {} or is zero", [poolAddress.value.toHexString(), pool ? "y" : "n"]);
      // still need to increase pool count because pool will be registered
      if (factory) {
        const factoryEntity = Factory.load(registryAddress.toHexString());
        if (!factoryEntity) {
          return;
        }
        factoryEntity.poolCount = factoryEntity.poolCount.plus(BIG_INT_ONE);
        factoryEntity.save();
      }
      continue;
    }
    if (!factory) {
      if (version == 1) {
        log.info("Retro adding stable registry pool: {}", [poolAddress.value.toHexString()]);
        addRegistryPool(poolAddress.value, registryAddress, block, timestamp, hash);
      } else {
        log.info("Retro adding crypto registry pool: {}", [poolAddress.value.toHexString()]);
        addCryptoRegistryPool(poolAddress.value, registryAddress, block, timestamp, hash);
      }
    } else {
      // crypto factories are straightforward
      if (version == 2) {
        log.info("Retro adding crypto factory pool: {}", [poolAddress.value.toHexString()]);
        createNewFactoryPool(
          2,
          registryAddress,
          false,
          ADDRESS_ZERO,
          cryptoFactory.get_token(poolAddress.value),
          timestamp,
          block,
        );
      } else {
        log.info("Retro adding stable factory pool: {}", [poolAddress.value.toHexString()]);
        const testMetaPool = MetaPool.bind(poolAddress.value);
        const testMetaPoolResult = testMetaPool.try_base_pool();
        const unknownMetapool = UNKNOWN_METAPOOLS.has(poolAddress.value.toHexString());
        const basePool = unknownMetapool
          ? UNKNOWN_METAPOOLS[poolAddress.value.toHexString()]
          : testMetaPoolResult.reverted
          ? ADDRESS_ZERO
          : testMetaPoolResult.value;
        createNewFactoryPool(
          1,
          registryAddress,
          !testMetaPoolResult.reverted || unknownMetapool,
          basePool,
          ADDRESS_ZERO,
          timestamp,
          block,
        );
      }
    }
  }
}

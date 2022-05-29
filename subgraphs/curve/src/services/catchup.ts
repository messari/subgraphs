// This is designed to make up for an issue with the way the current main
// registry was added to the address provider. Several pools were registered
// before the registry itself was indexed on the address provider and are
// therefore invisible to the subgraph. We can't backtrack automatically as
// we'd need information that we normally parsed from the event/registry.
// Issue may appear again in the future or on sidechain, so more functions
// might be added in the future.

import { Address, log } from "@graphprotocol/graph-ts";
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
} from "../common/constants/index";
import { createNewFactoryPool, createNewPool } from "./pools";
import { MetaPool } from "../../generated/templates/RegistryTemplate/MetaPool";
import { BigInt } from "@graphprotocol/graph-ts/index";
import { CurvePoolTemplate } from "../../generated/templates";
import { ERC20 } from "../../generated/templates/CurvePoolTemplate/ERC20";

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
    const testMetaPool = MetaPool.bind(POOLS[i]);
    const testMetaPoolResult = testMetaPool.try_base_pool();
    CurvePoolTemplate.create(POOLS[i]);
    createNewFactoryPool(
      1,
      Address.fromString("0xb17b674d9c5cb2e441f8e196a2f048a81355d031"),
      !testMetaPoolResult.reverted,
      testMetaPoolResult.reverted ? POOLS[i] : testMetaPoolResult.value,
      POOLS[i],
      BigInt.fromI32(1641737222),
      CATCHUP_BLOCK,
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

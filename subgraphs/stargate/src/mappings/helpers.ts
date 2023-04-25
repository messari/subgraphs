import { Address, BigInt } from "@graphprotocol/graph-ts";

import { NetworkConfigs } from "../../configurations/configure";

import { SDK } from "../sdk/protocols/bridge";
import { BridgePoolType } from "../sdk/protocols/bridge/enums";

import { Factory } from "../../generated/LPStaking/Factory";
import { Pool } from "../../generated/LPStaking/Pool";
import { PoolTemplate } from "../../generated/templates";

export function checkPoolCount(sdk: SDK): void {
  const poolCount = sdk.Protocol.getPoolCount();

  const factoryContract = Factory.bind(
    Address.fromString(NetworkConfigs.getFactoryAddress())
  );
  const poolCountFromFactory = factoryContract.allPoolsLength().toI32();

  if (poolCount != poolCountFromFactory) {
    for (let i = 0; i < poolCountFromFactory; i++) {
      const poolAddr = factoryContract.allPools(BigInt.fromI32(i));

      const pool = sdk.Pools.loadPool<string>(poolAddr);
      if (!pool.isInitialized) {
        const poolContract = Pool.bind(poolAddr);
        const poolName = poolContract.name();
        const poolSymbol = poolContract.symbol();
        const token = sdk.Tokens.getOrCreateToken(poolAddr);

        pool.initialize(poolName, poolSymbol, BridgePoolType.LIQUIDITY, token);

        PoolTemplate.create(poolAddr);
      }
    }
  }
}

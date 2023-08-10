/* eslint-disable prefer-const */
import { Address, dataSource, TypedMap } from "@graphprotocol/graph-ts";

import { ZERO_ADDRESS } from "./constants";

class UsdPathConfig {
  path: string[];
  pathUsdIdx: i32[];
  priority: i32;
}

export class BaseTokenDefinition {
  static optimism(
    optimismPools: TypedMap<string, string>
  ): TypedMap<Address, UsdPathConfig> {
    const USDC = Address.fromString(
      "0x7f5c764cbc14f9669b88837ca1490cca17c31607"
    );
    const sUSD = Address.fromString(
      "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9"
    );
    const DAI = Address.fromString(
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"
    );
    const OP = Address.fromString("0x4200000000000000000000000000000000000042");
    const WETH = Address.fromString(
      "0x4200000000000000000000000000000000000006"
    );

    let lookup = new TypedMap<Address, UsdPathConfig>();
    lookup.set(USDC, { pathUsdIdx: [-1], path: [ZERO_ADDRESS], priority: 4 });
    lookup.set(sUSD, {
      pathUsdIdx: [0],
      path: [optimismPools.get("USDC_sUSD")!],
      priority: 3,
    });
    lookup.set(DAI, {
      pathUsdIdx: [0],
      path: [optimismPools.get("USDC_DAI")!],
      priority: 2,
    });
    lookup.set(OP, {
      pathUsdIdx: [1],
      path: [optimismPools.get("OP_USDC")!],
      priority: 1,
    });
    lookup.set(WETH, {
      pathUsdIdx: [1],
      path: [optimismPools.get("WETH_USDC")!],
      priority: 0,
    });

    return lookup as TypedMap<Address, UsdPathConfig>;
  }

  static nonBase(): UsdPathConfig {
    let lookup: UsdPathConfig = {
      path: [ZERO_ADDRESS],
      pathUsdIdx: [-1],
      priority: -1,
    };
    return lookup as UsdPathConfig;
  }

  static network(
    network: string,
    hardcodedPools: TypedMap<string, TypedMap<string, string>>
  ): TypedMap<Address, UsdPathConfig> {
    let mapping = new TypedMap<Address, UsdPathConfig>();
    if (network == "optimism") {
      mapping = this.optimism(hardcodedPools.get(network)!);
    }

    return mapping as TypedMap<Address, UsdPathConfig>;
  }
}

export function getBaseTokenLookup(
  token: Address,
  hardcodedPools: TypedMap<string, TypedMap<string, string>>
): UsdPathConfig {
  let baseTokenLookup = BaseTokenDefinition.network(
    dataSource.network(),
    hardcodedPools
  );
  let tokenLookup = baseTokenLookup.get(token);
  if (tokenLookup == null) {
    tokenLookup = BaseTokenDefinition.nonBase();
  }
  return tokenLookup;
}

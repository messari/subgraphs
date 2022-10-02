/* eslint-disable prefer-const */
import { Address, dataSource, TypedMap } from "@graphprotocol/graph-ts";
import { ZERO_ADDRESS } from "./constants";

class UsdPathConfig {
  path: string[];
  pathUsdIdx: i32[];
  priority: i32;
}

export class BaseTokenDefinition {
  static optimism(): TypedMap<Address, UsdPathConfig> {
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

    const USDC_sUSD = "0xd16232ad60188b68076a235c65d692090caba155";
    const USDC_DAI = "0x4f7ebc19844259386dbddb7b2eb759eefc6f8353";
    const OP_USDC = "0x47029bc8f5cbe3b464004e87ef9c9419a48018cd";
    const WETH_USDC = "0x79c912fef520be002c2b6e57ec4324e260f38e50";

    let lookup = new TypedMap<Address, UsdPathConfig>();
    lookup.set(USDC, { pathUsdIdx: [-1], path: [ZERO_ADDRESS], priority: 4 });
    lookup.set(sUSD, { pathUsdIdx: [0], path: [USDC_sUSD], priority: 3 });
    lookup.set(DAI, { pathUsdIdx: [0], path: [USDC_DAI], priority: 2 });
    lookup.set(OP, { pathUsdIdx: [1], path: [OP_USDC], priority: 1 });
    lookup.set(WETH, { pathUsdIdx: [1], path: [WETH_USDC], priority: 0 });

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

  static network(network: string): TypedMap<Address, UsdPathConfig> {
    let mapping = new TypedMap<Address, UsdPathConfig>();
    if (network == "optimism") {
      mapping = this.optimism();
    }

    return mapping as TypedMap<Address, UsdPathConfig>;
  }
}

export function getBaseTokenLookup(token: Address): UsdPathConfig {
  let baseTokenLookup = BaseTokenDefinition.network(dataSource.network());
  let tokenLookup = baseTokenLookup.get(token);
  if (tokenLookup == null) {
    tokenLookup = BaseTokenDefinition.nonBase();
  }
  return tokenLookup;
}

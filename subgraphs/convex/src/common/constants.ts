import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const HARMONY = "HARMONY";
  export const JUNO = "JUNO";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const OSMOSIS = "OSMOSIS";
  export const MATIC = "MATIC"; // aka Polygon
  export const XDAI = "XDAI"; // aka Gnosis Chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace VaultFeeType {
  export const MANAGEMENT_FEE = "MANAGEMENT_FEE";
  export const PERFORMANCE_FEE = "PERFORMANCE_FEE";
  export const DEPOSIT_FEE = "DEPOSIT_FEE";
  export const WITHDRAWAL_FEE = "WITHDRAWAL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace Protocol {
  export const NAME = "convex";
  export const SLUG = "convex";
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.1.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}

export const MAX_BPS = BigInt.fromI32(10000);
export const SECONDS_PER_YEAR = BigInt.fromI32(31556952);

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;

export const DEFAULT_MANAGEMENT_FEE = BigInt.fromI32(200);
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(2000);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_SECONDS_PER_DAY = BigInt.fromI32(SECONDS_PER_DAY);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_SECONDS_PER_DAY = new BigDecimal(
  BigInt.fromI32(SECONDS_PER_DAY)
);

export const USDC_DECIMALS = 6;
export const DEFAULT_DECIMALS = BigInt.fromI32(18);
export const DENOMINATOR = BigDecimal.fromString("10000");
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);
export const ZERO_ADDRESS_STRING = "0x0000000000000000000000000000000000000000";

export const CONVEX_BOOSTER_ADDRESS = Address.fromString(
  "0xf403c135812408bfbe8713b5a23a04b3d48aae31"
);

export namespace CURVE_REGISTRY {
  export const v1 = Address.fromString(
    "0x7D86446dDb609eD0F5f8684AcF30380a356b2B4c"
  );
  export const v2 = Address.fromString(
    "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"
  );
}

export namespace CURVE_POOL_REGISTRY {
  export const v1 = Address.fromString(
    "0x8F942C20D02bEfc377D41445793068908E2250D0"
  );
  export const v2 = Address.fromString(
    "0x4AacF35761d06Aa7142B9326612A42A2b9170E33"
  );
}

export const POOL_ADDRESS_V2 = new Map<string, Address>();
POOL_ADDRESS_V2.set(
  "0x3b6831c0077a1e44ed0a21841c3bc4dc11bce833",
  Address.fromString("0x9838eCcC42659FA8AA7daF2aD134b53984c9427b")
);
POOL_ADDRESS_V2.set(
  "0x3d229e1b4faab62f621ef2f6a610961f7bd7b23b",
  Address.fromString("0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B")
);

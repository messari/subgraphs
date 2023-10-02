/* eslint-disable rulesdir/no-checksum-addresses */
import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

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

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
}

export namespace NULL {
  export const TYPE_STRING = "0x0000000000000000000000000000000000000000";
  export const TYPE_ADDRESS = Address.fromString(TYPE_STRING);
}

export namespace Protocol {
  export const NAME = "convex";
  export const SLUG = "convex";
}

export const MAX_BPS = BigInt.fromI32(10000);
export const SECONDS_PER_YEAR = BigInt.fromI32(31556952);

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;

export const CVX_CLIFF_COUNT = BigDecimal.fromString("1000");
export const CVX_CLIFF_SIZE = BigDecimal.fromString("100000");
export const CVX_MAX_SUPPLY = BigDecimal.fromString("100000000");

export const DEFAULT_MANAGEMENT_FEE = BigInt.fromI32(200);
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(2000);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(50);

export const INT_EIGHTEEN = 18 as i32;

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

export const CONVEX_BOOSTER_ADDRESS = Address.fromString(
  "0xf403c135812408bfbe8713b5a23a04b3d48aae31"
);
export const CRV_TOKEN_ADDRESS = Address.fromString(
  "0xd533a949740bb3306d119cc777fa900ba034cd52"
);
export const CONVEX_TOKEN_ADDRESS = Address.fromString(
  "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B"
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

export const MISSING_POOLS_MAP = new TypedMap<Address, Address>();
MISSING_POOLS_MAP.set(
  Address.fromString("0x90244f43d548a4f8dfecfad91a193465b1fad6f7"),
  Address.fromString("0x941eb6f616114e4ecaa85377945ea306002612fe")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0xe160364fd8407ffc8b163e278300c6c5d18ff61d"),
  Address.fromString("0xf43b15ab692fde1f9c24a9fce700adcc809d5391")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x2302aabe69e6e7a1b0aa23aac68fccb8a4d2b460"),
  Address.fromString("0x9a22cdb1ca1cdd2371cd5bb5199564c4e89465eb")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x1054ff2ffa34c055a13dcd9e0b4c0ca5b3aeceb9"),
  Address.fromString("0xe07bde9eb53deffa979dae36882014b758111a78")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x3a70dfa7d2262988064a2d051dd47521e43c9bdd"),
  Address.fromString("0x3a70dfa7d2262988064a2d051dd47521e43c9bdd")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x401322b9fddba8c0a8d40fbcece1d1752c12316b"),
  Address.fromString("0xfe4a08f22fe65759ba91db2e2cada09b4415b0d7")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x54c8ecf46a81496eeb0608bd3353388b5d7a2a33"),
  Address.fromString("0x5b692073f141c31384fae55856cfb6cbffe91e60")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x08cea8e5b4551722deb97113c139dd83c26c5398"),
  Address.fromString("0x6df0d77f0496ce44e72d695943950d8641fca5cf")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x8682fbf0cbf312c891532ba9f1a91e44f81ad7df"),
  Address.fromString("0x1570af3df649fc74872c5b8f280a162a3bdd4eb6")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x22cf19eb64226e0e1a79c69b345b31466fd273a7"),
  Address.fromString("0xacce4fe9ce2a6fe9af83e7cf321a3ff7675e0ab6")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x127091ede112aed7bae281747771b3150bb047bb"),
  Address.fromString("0xeb0265938c1190ab4e3e1f6583bc956df47c0f93")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x80caccdbd3f07bbdb558db4a9e146d099933d677"),
  Address.fromString("0xef04f337fcb2ea220b6e8db5edbe2d774837581c")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x3660bd168494d61ffdac21e403d0f6356cf90fd7"),
  Address.fromString("0x6ec38b3228251a0c5d491faf66858e2e23d7728b")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0xf7b55c3732ad8b2c2da7c24f30a69f55c54fb717"),
  Address.fromString("0xf7b55c3732ad8b2c2da7c24f30a69f55c54fb717")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x48ff31bbbd8ab553ebe7cbd84e1ea3dba8f54957"),
  Address.fromString("0x48ff31bbbd8ab553ebe7cbd84e1ea3dba8f54957")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0xdf55670e27be5cde7228dd0a6849181891c9eba1"),
  Address.fromString("0x3211c6cbef1429da3d0d58494938299c92ad5860")
);
MISSING_POOLS_MAP.set(
  Address.fromString("0x8c524635d52bd7b1bd55e062303177a7d916c046"),
  Address.fromString("0x8c524635d52bd7b1bd55e062303177a7d916c046")
);

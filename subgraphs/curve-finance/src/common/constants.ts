import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

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

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace InterestRateType {
  export const STABLE = "STABLE";
  export const VARIABLE = "VARIABLE";
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
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
  export const NAME = "Curve Finance";
  export const SLUG = "curve-finance";
  export const NETWORK = Network.MAINNET;
  export const SCHEMA_VERSION = "1.3.0";
  export const SUBGRAPH_VERSION = "1.0.0";
  export const METHODOLOGY_VERSION = "1.0.0";
}

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const MAX_BPS = BigInt.fromI32(10000);
export const DEFAULT_DECIMALS = BigInt.fromI32(18);

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_NEGATIVE_ONE = BigInt.fromString("-1");

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");
export const BIGDECIMAL_POINT_FOUR = BigDecimal.fromString("0.4");
export const BIGDECIMAL_NEGATIVE_ONE = BigDecimal.fromString("-1");
export const BIG_DECIMAL_SECONDS_PER_DAY = BigDecimal.fromString("86400");

export const FEE_DENOMINATOR_BIGINT = BIGINT_TEN.pow(10);
export const FEE_DENOMINATOR = BigDecimal.fromString("10000000000");
export const NUMBER_OF_WEEKS_DENOMINATOR = BigInt.fromI32(604800);

export const DEFAULT_POOL_FEE = BigInt.fromString("4000000");
export const DEFAULT_ADMIN_FEE = BigInt.fromString("5000000000");

export const PRICE_CACHING_BLOCKS = BigInt.fromI32(1);

export const CURVE_ADDRESS_PROVIDER = Address.fromString(
  "0x0000000022d53366457f9d5e68ec105046fc4383"
);

// Missing Name and Symbol for the ETH token
export const ETH_ADDRESS = Address.fromString(
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
);

export const PROTOCOL_ID = Address.fromString(
  "0x0000000022D53366457F9d5E68Ec105046FC4383"
);
export const POOL_INFO_ADDRESS = Address.fromString(
  "0xe64608E223433E8a03a1DaaeFD8Cb638C14B552C"
);
export const GAUGE_CONTROLLER_ADDRESS = Address.fromString(
  "0x2f50d538606fa9edd2b11e2446beb18c9d5846bb"
);
export const CRV_TOKEN_ADDRESS = Address.fromString(
  "0xd533a949740bb3306d119cc777fa900ba034cd52"
);

export const POOL_REGISTRIES: Address[] = [
  Address.fromString("0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5"), // PoolRegistry
  Address.fromString("0x7d86446ddb609ed0f5f8684acf30380a356b2b4c"), // PoolRegistryV2
  Address.fromString("0xB9fC157394Af804a3578134A6585C0dc9cc990d4"), // MetapoolFactory
  Address.fromString("0x8F942C20D02bEfc377D41445793068908E2250D0"), // CryptoSwapRegistry
  Address.fromString("0xF18056Bbd320E96A48e3Fbf8bC061322531aac99"), // CryptoPoolFactory
]

export const HARDCODED_BASEPOOLS_LP_TOKEN: Address[] = [
  Address.fromString("0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490"), // 3crv
  Address.fromString("0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3"), // renbtc
  Address.fromString("0xC25a3A3b969415c80451098fa907EC722572917F"), // susd
  Address.fromString("0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B"), // busd
  Address.fromString("0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2"), // compound
  Address.fromString("0xb19059ebb43466C323583928285a49f558E572Fd"), // hbtc
  Address.fromString("0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8"), // pax
  Address.fromString("0x49849C98ae39Fff122806C06791Fa73784FB3675"), // ren
  Address.fromString("0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c"), // seth
  Address.fromString("0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23"), // usdt
  Address.fromString("0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8"), // y
  Address.fromString("0x3a664Ab939FD8482048609f652f9a0B0677337B9"), // dusd
  Address.fromString("0xD2967f45c4f384DEEa880F807Be904762a3DeA07"), // gusd
  Address.fromString("0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858"), // husd
  Address.fromString("0x6D65b498cb23deAba52db31c93Da9BFFb340FB8F"), // linkusd
  Address.fromString("0x1AEf73d49Dedc4b1778d0706583995958Dc862e6"), // musd
  Address.fromString("0xC2Ee6b0334C261ED60C72f6054450b61B8f18E35"), // rsv
  Address.fromString("0x97E2768e8E73511cA874545DC5Ff8067eB19B787"), // usdk
  Address.fromString("0x4f3E8F405CF5aFC05D68142F3783bDfE13811522"), // usdn
]

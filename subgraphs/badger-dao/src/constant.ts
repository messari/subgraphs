import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
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

// default usdc denominator
export const USDC_DENOMINATOR = BigInt.fromString("1000000");

// default no of decimals for tokens
export const DEFAULT_DECIMALS = 18;

// number values
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_HUNDRED = BigInt.fromString("100");
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

// default MAX FEE
export const MAX_FEE = BigDecimal.fromString("10000");

// no of seconds of a day
export const SECONDS_PER_DAY = 84600;
export const SECONDS_PER_HOUR = 3600;

export const PROTOCOL_ID = Address.fromString("0xFda7eB6f8b7a9e9fCFd348042ae675d1d652454f");
export const PROTOCOL_NAME = "Badger Dao";
export const PROTOCOL_SLUG = "badger";
export const PROTOCOL_TYPE = ProtocolType.YIELD;
export const PROTOCOL_NETWORK = Network.BSC;
export const PROTOCOL_SCHEMA_VERSION = "1.2.1";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

// chainlink contract address for individual token
export const CHAINLINK_BADGER_USD = Address.fromString(
  "0x66a47b7206130e6FF64854EF0E1EDfa237E65339",
);
export const CHAINLINK_BTC_USD = Address.fromString("0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c");

// BADGERWBTC-f pool contract https://curve.fi/factory-crypto/4
export const BADGER_WBTC_POOL_CONTRACT = Address.fromString(
  "0x50f3752289e1456BfA505afd37B241bca23e685d",
);
export const BADGER_TOKEN = Address.fromString("0x3472A5A71965499acd81997a54BBA8D852C6E53d");
export const WBTC_TOKEN = Address.fromString("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599");

// tokens array separated by router which provides their prices for faster lookup
export namespace RouterType {
  export const SUSHI_ROUTER = "SUSHI_ROUTER";
  export const CURVE_ROUTER = "CURVE_ROUTER";
  export const YEARN_ROUTER = "YEARN_ROUTER";
  export const CHAINLINK_CUSTOM = "CHAINLINK_CUSTOM";
}

export const SUSHI_ROUTER_TOKENS = [
  Address.fromString("0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b"),
  Address.fromString("0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7"),
  Address.fromString("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  Address.fromString("0x798d1be841a82a273720ce31c822c61a67a601c3"),
  Address.fromString("0x9a13867048e01c663ce8ce2fe0cdae69ff9f35e3"),
  Address.fromString("0xceff51756c56ceffca006cd410b03ffc46dd3a58"),
  Address.fromString("0x110492b31c59716ac47337e616804e3e3adc0b4a"),
  Address.fromString("0x798d1be841a82a273720ce31c822c61a67a601c3"),
];

export const CURVE_ROUTER_TOKENS = [
  Address.fromString("0x49849c98ae39fff122806c06791fa73784fb3675"),
];

export const YEARN_ROUTER_TOKENS = [
  Address.fromString("0xc4ad29ba4b3c580e6d59105fff484999997675ff"),
  Address.fromString("0x04c90c198b2eff55716079bc06d7ccc4aa4d7512"),
  Address.fromString("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b"),
];

export const CHAINLINK_CUSTOM_TOKENS = [
  Address.fromString("0x137469b55d1f15651ba46a89d0588e97dd0b6562"),
];

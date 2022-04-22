import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Using Coingecko slugs
export namespace Network {
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISM";
  export const POLYGON = "POLYGON";
  export const XDAI = "XDAI";
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

// no of seconds of a day
export const SECONDS_PER_DAY = 84600;

export const PROTOCOL_ID = Address.fromString("0xFda7eB6f8b7a9e9fCFd348042ae675d1d652454f");
export const PROTOCOL_NAME = "Badger Dao";
export const PROTOCOL_SLUG = "badger";
export const PROTOCOL_TYPE = ProtocolType.YIELD;
export const PROTOCOL_NETWORK = Network.BSC;
export const PROTOCOL_SCHEMA_VERSION = "1.1.1";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

// tokens array separated by router which provides their prices for faster lookup
export namespace RouterType {
  export const SUSHI_ROUTER = "SUSHI_ROUTER";
  export const CURVE_ROUTER = "CURVE_ROUTER";
  export const YEARN_ROUTER = "YEARN_ROUTER";
}

export const SUSHI_ROUTER_TOKENS = [
  Address.fromString("0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b"),
  Address.fromString("0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7"),
  Address.fromString("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  Address.fromString("0x798d1be841a82a273720ce31c822c61a67a601c3"),
  Address.fromString("0x9a13867048e01c663ce8ce2fe0cdae69ff9f35e3"),
  Address.fromString("0xceff51756c56ceffca006cd410b03ffc46dd3a58"),
  Address.fromString("0x110492b31c59716ac47337e616804e3e3adc0b4a"),
];

export const CURVE_ROUTER_TOKENS = [
  Address.fromString("0x49849c98ae39fff122806c06791fa73784fb3675"),
];

export const YEARN_ROUTER_TOKENS = [
  Address.fromString("0xc4ad29ba4b3c580e6d59105fff484999997675ff"),
  Address.fromString("0x04c90c198b2eff55716079bc06d7ccc4aa4d7512"),
  Address.fromString("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b"),
];

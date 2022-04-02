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

// zero values
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_HUNDRED = BigInt.fromString("100");
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_HUNDRED = BigDecimal.fromString("100");

// https://docs.badger.com/badger-finance/setts/overview-and-fees#interest-bearing-rewards
export const DEFAULT_PERFORMANCE_FEE = BigInt.fromI32(2000);
export const DEFAULT_WITHDRAWAL_FEE = BigInt.fromI32(10);

// no of seconds of a day
export const SECONDS_PER_DAY = 84600;

export const PROTOCOL_ID = Address.fromString("0xFda7eB6f8b7a9e9fCFd348042ae675d1d652454f");
export const PROTOCOL_NAME = "Badger DAO";
export const PROTOCOL_SLUG = "badger";
export const PROTOCOL_TYPE = ProtocolType.YIELD;
export const PROTOCOL_NETWORK = Network.ETHEREUM;
export const PROTOCOL_SCHEMA_VERSION = "1.0.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

// curve tokens price calculations
export const ETH_MAINNET_CALCULATIONS_SUSHI_ADDRESS = "0x8263e161A855B644f582d9C164C66aABEe53f927";
export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS = "0x25BF7b72815476Dd515044F9650Bf79bAd0Df655";

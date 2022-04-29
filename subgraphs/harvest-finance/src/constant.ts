import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Using Coingecko slugs
export namespace Network {
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "MAINNET";
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

export const PROTOCOL_ID = Address.fromString("0xE0e514c71282b6f4e823703a39374Cf58dc3eA4f");
export const PROTOCOL_NAME = "Harvest Finance";
export const PROTOCOL_SLUG = "harvest-finance";
export const PROTOCOL_TYPE = ProtocolType.YIELD;
export const PROTOCOL_NETWORK = Network.ETHEREUM;
export const PROTOCOL_SCHEMA_VERSION = "1.1.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

// null address
export const NULL_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000");

// chainlink's token price contract


// Tokens
export const WETH_ADDRESS = Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");


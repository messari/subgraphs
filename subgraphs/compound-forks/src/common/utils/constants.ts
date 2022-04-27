import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
export namespace Network {
  export const ARBITRUM = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BINANCE_SMART_CHAIN";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY_SHARD_0";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISTIC_ETHEREUM";
  export const POLYGON = "POLYGON_POS";
  export const XDAI = "XDAI";
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
}

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";

export const COMPTROLLER_ADDRESS = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b";
export const PRICE_ORACLE1_ADDRESS = "0x02557a5E05DeFeFFD4cAe6D83eA3d173B272c904";
export const SAI_ADDRESS = "0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359";
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const CUSDC_ADDRESS = "0x39aa39c021dfbae8fac545936693ac917d5e7563";
export const CUSDT_ADDRESS = "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9";
export const CTUSD_ADDRESS = "0x12392f67bdf24fae0af363c24ac620a2f67dad86";

export const CREAM_COMPTROLLER_ADDRESS = "0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258";

export const IRONBANK_COMPTROLLER_ADDRESS = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb";

// PROTOCOL_DATA
////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));
export const BLOCKS_PER_DAY = BigDecimal.fromString("6570"); // blocks every 13.15 seconds
export const BLOCKS_PER_YEAR = BLOCKS_PER_DAY.times(DAYS_PER_YEAR);

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const NETWORK_ETHEREUM = Network.ETHEREUM;
export const PROTOCOL_TYPE = ProtocolType.LENDING;
export const LENDING_TYPE = LendingType.POOLED;
export const PROTOCOL_RISK_TYPE = RiskType.ISOLATED;
export const SUBGRAPH_VERSION = "1.4.16";
export const SCHEMA_VERSION = "1.1.0";
export const COMPOUND_DECIMALS = 8;
export const INITIAL_EXCHANGE_RATE = BigDecimal.fromString(".02");
export const COLLATERAL_FACTOR_OFFSET = 16;

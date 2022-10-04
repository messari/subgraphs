import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "MakerDAO";
export const PROTOCOL_SLUG = "makerdao";
export const PROTOCOL_SCHEMA_VERSION = "1.3.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.2.1";
export const PROTOCOL_METHODOLOGY_VERSION = "1.1.0";

////////////////////////
///// Schema Enums /////
////////////////////////

// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
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

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const PROTOCOL_FEE = "PROTOCOL_FEE";
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
  export const FIXED = "FIXED";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROW = "BORROWER";
}

// They are defined as u32 for use with switch/case
export namespace ProtocolSideRevenueType {
  export const STABILITYFEE: u32 = 1;
  export const LIQUIDATION: u32 = 2;
  export const PSM: u32 = 3;
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_THREE = BigInt.fromI32(3);
export const BIGINT_SIX = BigInt.fromI32(6);
export const BIGINT_TWELVE = BigInt.fromI32(12);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
//10^18
export const BIGINT_ONE_WAD = BigInt.fromString("1000000000000000000");
// 10^27
export const BIGINT_ONE_RAY = BigInt.fromString("1000000000000000000000000000");

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const NEG_INT_ONE = -1 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_THREE = new BigDecimal(BIGINT_THREE);
export const BIGDECIMAL_SIX = new BigDecimal(BIGINT_SIX);
export const BIGDECIMAL_TWELVE = new BigDecimal(BIGINT_TWELVE);
export const BIGDECIMAL_ONE_HUNDRED = new BigDecimal(BigInt.fromI32(100));
export const BIGDECIMAL_ONE_THOUSAND = new BigDecimal(BigInt.fromI32(1000));
export const BIGDECIMAL_NEG_ONE = BigDecimal.fromString("-1");
export const BIGDECIMAL_ONE_WAD = BIGINT_ONE_WAD.toBigDecimal();
export const BIGDECIMAL_ONE_RAY = BIGINT_ONE_RAY.toBigDecimal();

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

export const WAD = 18 as i32;
export const RAY = 27 as i32;
export const RAD = 45 as i32;

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 360
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;
export const SECONDS_PER_YEAR_BIGINT = BigInt.fromI32(60 * 60 * 24 * 365);
export const SECONDS_PER_YEAR_BIGDECIMAL = new BigDecimal(BigInt.fromI32(60 * 60 * 24 * 365));
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const VAT_ADDRESS = "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b".toLowerCase();
export const VOW_ADDRESS = "0xa950524441892a31ebddf91d3ceefa04bf454466".toLowerCase();
export const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase();

// unconventional token requiring special handling
export const ILK_SAI = "0x5341490000000000000000000000000000000000000000000000000000000000";
// the first market, used to detect cat/dog contract
export const ILK_ETH_A = "0x4554482d41000000000000000000000000000000000000000000000000000000";

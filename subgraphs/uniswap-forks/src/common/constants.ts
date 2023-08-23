import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Versions } from "../../src/versions";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_SCHEMA_VERSION = Versions.getSchemaVersion();

/////////////////////
///// Protocols /////
/////////////////////
export namespace Protocol {
  export const APESWAP = "Apeswap";
  export const UNISWAP_V2 = "Uniswap V2";
  export const SUSHISWAP = "Sushiswap";
}
////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They are mainly intended for convenience on the data consumer side.
// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BASE = "BASE";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const HARMONY = "HARMONY";
  export const MAINNET = "MAINNET"; // Ethereum mainnet
  export const FANTOM = "FANTOM";
  export const FUSE = "FUSE";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const NEAR_MAINNET = "NEAR_MAINNET";
  export const OPTIMISM = "OPTIMISM";
  export const MATIC = "MATIC"; // aka Polygon
  export const GNOSIS = "GNOSIS"; // aka Gnosis Chain
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
  export const FIXED_LP_FEE = "FIXED_LP_FEE";
  export const DYNAMIC_LP_FEE = "DYNAMIC_LP_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export namespace HelperStoreType {
  export const NATIVE_TOKEN = "NATIVE_TOKEN";
  export const USERS = "USERS";
  // Pool addresses are also stored in the HelperStore
}

export namespace TransferType {
  export const MINT = "MINT";
  export const BURN = "BURN";
  // Pool addresses are also stored in the HelperStore
}

export namespace FeeSwitch {
  export const ON = "ON";
  export const OFF = "OFF";
  // Pool addresses are also stored in the HelperStore
}

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
}

export namespace RewardIntervalType {
  export const BLOCK = "BLOCK";
  export const TIMESTAMP = "TIMESTAMP";
  export const NONE = "NONE";
}

export namespace MasterChef {
  export const MINICHEF = "MINICHEF";
  export const MASTERCHEF = "MASTERCHEF";
  export const MASTERCHEFV2 = "MASTERCHEFV2";
  export const MASTERCHEFV3 = "MASTERCHEFV3";
}

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_FIVE = BigInt.fromI32(5);
export const RECENT_BLOCK_THRESHOLD = BigInt.fromI32(5);
export const BIGINT_TEN = BigInt.fromI32(10);
export const BIGINT_FIFTY = BigInt.fromI32(50);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_THREE_THOUSAND = BigInt.fromI32(3000);
export const BIGINT_FIVE_THOUSAND = BigInt.fromI32(5000);
export const BIGINT_TEN_THOUSAND = BigInt.fromI32(10000);
export const BIGINT_TWENTY_FIVE_THOUSAND = BigInt.fromI32(25000);
export const BIGINT_ONE_HUNDRED_THOUSAND = BigInt.fromI32(100000);
export const BIGINT_TWO_HUNDRED_FIFTY_THOUSAND = BigInt.fromI32(250000);
export const BIGINT_FOUR_HUNDRED_THOUSAND = BigInt.fromI32(400000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;
export const INT_FIVE = 5 as i32;

export const BIGDECIMAL_NEG_ONE = new BigDecimal(BIGINT_NEG_ONE);
export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_TEN = new BigDecimal(BIGINT_TEN);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

export const BIGDECIMAL_FIFTY_PERCENT = new BigDecimal(BIGINT_FIFTY);
export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export const SECONDS_PER_HOUR = 60 * 60;
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const ONE_WEEK_IN_DAYS = BigInt.fromI32(7);

export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

// Imported into configurations typescript file to set minimum liquidity thresholds for estimating price using a liquidity pool;
export const MINIMUM_LIQUIDITY_THREE_THOUSAND = new BigDecimal(
  BIGINT_THREE_THOUSAND
);
export const MINIMUM_LIQUIDITY_FIVE_THOUSAND = new BigDecimal(
  BIGINT_FIVE_THOUSAND
);
export const MINIMUM_LIQUIDITY_TEN_THOUSAND = new BigDecimal(
  BIGINT_TEN_THOUSAND
);
export const MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND = new BigDecimal(
  BIGINT_TWENTY_FIVE_THOUSAND
);
export const MINIMUM_LIQUIDITY_ONE_THOUSAND = new BigDecimal(BIGINT_THOUSAND);
export const MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND = new BigDecimal(
  BIGINT_ONE_HUNDRED_THOUSAND
);
export const MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND = new BigDecimal(
  BIGINT_TWO_HUNDRED_FIFTY_THOUSAND
);
export const MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND = new BigDecimal(
  BIGINT_FOUR_HUNDRED_THOUSAND
);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const PRICE_CHANGE_BUFFER_LIMIT = 5 as i32;
export const BIGDECIMAL_TEN_BILLION = new BigDecimal(
  BigInt.fromString("10000000000")
);
export const BIGDECIMAL_FIVE_PERCENT = BigDecimal.fromString("0.05");

import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "MakerDao";
export const PROTOCOL_SLUG = "makerdao";
export const PROTOCOL_SCHEMA_VERSION = "1.2.1";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

////////////////////////
///// Schema Enums /////
////////////////////////

// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
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
  export const FIXED_TERM = "FIXED_TERM";
}
export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROW = "BORROWER";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const UNISWAP_V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const USDC_WETH_PAIR = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc"; // created 10008355
export const DAI_WETH_PAIR = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11"; // created block 10042267
export const USDT_WETH_PAIR = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852"; // created block 10093341

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

export const MCD_DEPLOY_ADDRESS = "0xbaa65281c2FA2baAcb2cb550BA051525A480D3F4".toLowerCase();
export const MCD_SPOT_ADDRESS = "0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3".toLowerCase();
export const MCD_JUG_ADDRESS = "0x19c0976f590D67707E62397C87829d896Dc0f1F1".toLowerCase();
export const MCD_CAT_ADDRESS = "0x78F2c2AF65126834c51822F56Be0d7469D7A523E".toLowerCase();
export const MCD_CAT_V2_ADDRESS = "0xa5679C04fc3d9d8b0AaB1F0ab83555b301cA70Ea".toLowerCase();
export const MCD_VAT_ADDRESS = "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b".toLowerCase();
export const MCD_VOW_ADDRESS = "0xa950524441892a31ebddf91d3ceefa04bf454466".toLowerCase();
export const MCD_POT_ADDRESS = "0x197e90f9fad81970ba7976f33cbd77088e5d7cf7".toLowerCase();

export const ILK_REGISTRY_1_ADDRESS = "0x8b4ce5DCbb01e0e1f0521cd8dCfb31B308E52c24".toLowerCase();
export const ILK_REGISTRY_1_STARTBLOCK = BigInt.fromI32(10744721);
export const ILK_REGISTRY_2_ADDRESS = "0x5a464C28D19848f44199D003BeF5ecc87d090F87".toLowerCase();
export const ILK_REGISTRY_2_STARTBLOCK = BigInt.fromI32(12251871);

export const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f".toLowerCase();
export const VAT_ADDRESS = "0x35d1b3f3d7966a1dfe207aa4514c12a259a0492b".toLowerCase();
export const ADDRESS_LENGTH = 20;

export const COLLATERAL_FILE_SIGNATURE = "0x1a0b287e";

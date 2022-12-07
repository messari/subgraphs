import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Euler";
export const PROTOCOL_SLUG = "euler";

////////////////////////
///// Schema Enums /////
////////////////////////

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

export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const BORROW = "BORROW";
  export const LIQUIDATE = "LIQUIDATE";
  export const REPAY = "REPAY";
}

export namespace ActivityType {
  export const DAILY = "DAILY";
  export const HOURLY = "HOURLY";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const EULER_ADDRESS = "0x27182842E098f60e3D576794A5bFFb0777E025d3";
export const EXEC_PROXY_ADDRESS = "0x59828fdf7ee634aaad3f58b19fdba3b03e2d9d80";
export const USDC_WETH_03_ADDRESS = "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8";
export const USDC_ERC20_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const EULER_GENERAL_VIEW_ADDRESS = "0x9D2B3052f5A3c156A34FC32cD08E9F5501720ea4";
export const EULER_GENERAL_VIEW_V2_ADDRESS = "0xACC25c4d40651676FEEd43a3467F3169e3E68e42";
export const CRYPTEX_MARKET_ID = "0x321c2fe4446c7c963dc41dd58879af648838f98d";
export const EULSTAKES_ADDRESS = "0xc697bb6625d9f7adcf0fbf0cbd4dcf50d8716cd3";
// EUL token address is the same as EUL market address
export const EUL_ADDRESS = "0xd9fcd98c322942075a5c3860693e9f4f03aae07b";
export const EUL_MARKET_ADDRESS = "0xd9fcd98c322942075a5c3860693e9f4f03aae07b";
export const VIEW_V2_START_BLOCK_NUMBER = BigInt.fromI32(14482429);

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_NEG_ONE = BigInt.fromI32(-1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_THREE = BigInt.fromI32(3);
export const BIGINT_FOUR = BigInt.fromI32(4);
export const BIGINT_SIX = BigInt.fromI32(6);
export const BIGINT_TWELVE = BigInt.fromI32(12);
export const BIGINT_TWENTY_FOUR = BigInt.fromI32(24);
export const BIGINT_SEVENTY_FIVE = BigInt.fromI32(75);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_ONE_HUNDRED_TWENTY = BigInt.fromI32(120);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromI32(10).pow(18);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_THREE = new BigDecimal(BIGINT_THREE);
export const BIGDECIMAL_FOUR = new BigDecimal(BIGINT_FOUR);
export const BIGDECIMAL_SIX = new BigDecimal(BIGINT_SIX);
export const BIGDECIMAL_TWELVE = new BigDecimal(BIGINT_TWELVE);
export const BIGDECIMAL_TWENTY_FOUR = new BigDecimal(BIGINT_TWENTY_FOUR);
export const BIGDECIMAL_ONE_HUNDRED_TWENTY = new BigDecimal(BIGINT_ONE_HUNDRED_TWENTY);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60)));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));
export const SECONDS_PER_BLOCK = 13;
export const BLOCKS_PER_DAY = SECONDS_PER_DAY / SECONDS_PER_BLOCK;

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";
export const USDC_SYMBOL = "USDC";

//////////////////////////
///// Euler Specific /////
//////////////////////////

export const DECIMAL_PRECISION = BIGINT_TEN_TO_EIGHTEENTH.toBigDecimal();
export const CONFIG_FACTOR_SCALE = BigDecimal.fromString("4e9");
export const RESERVE_FEE_SCALE = BigDecimal.fromString("4e9");
export const DEFAULT_RESERVE_FEE = BigDecimal.fromString("0.23").times(RESERVE_FEE_SCALE);
// How much of a liquidation is credited to the underlying's reserves.
export const UNDERLYING_RESERVES_FEE = BigDecimal.fromString("0.02").times(DECIMAL_PRECISION);
// if delta Reverse < delta totalBalances +/- RESERVE_PRECISION
// consider them equal
export const RESERVE_PRECISION = BigInt.fromI32(10).pow(9);
export const EUL_DECIMALS = 1e18;

export const INITIAL_RESERVES = BigInt.fromI32(1e6 as i32);
export const EXEC_START_BLOCK_NUMBER = BigInt.fromI32(13711556);
export const UNISWAP_Q192 = BigDecimal.fromString(BigInt.fromI32(2).pow(192).toString());

export const INTEREST_RATE_PRECISION = BigDecimal.fromString("1e25");
export const INTEREST_RATE_DECIMALS = BigDecimal.fromString("1e27");
export const INTERNAL_DEBT_PRECISION = BigDecimal.fromString("1e9");
export const MODULEID__EXEC = BigInt.fromI32(5);
export const MODULEID__RISK_MANAGER = BigInt.fromI32(1000000);
export const MODULEID__MARKETS = BigInt.fromI32(2);
export const INITIAL_INTEREST_ACCUMULATOR = BigInt.fromI32(10).pow(27);

// the EulStakes.sol was deployed at block 14975091, or epoch 6
export const START_EPOCH = 6 as i32;
export const MAX_EPOCHS = 90;
export const START_EPOCH_BLOCK = BigInt.fromI32(14930000);
export const BLOCKS_PER_EPOCH = 100000 as i32;
export const EUL_DIST = [
  43231.14, 44800.97, 46564.39, 48541.27, 50752.38, 53219.03, 55962.62, 59004.03, 62362.78, 66056.03, 70097.3, 74494.98,
  79250.6, 84356.92, 89795.88, 95536.5, 101533.06, 107723.4, 114028.05, 120350.07, 126576.02, 132578.4, 138219.39,
  143356.23, 147847.72, 151561.68, 154382.67, 156219.3, 157010.35, 156729.02, 155384.87, 153023.12, 149721.46,
  145584.72, 140738.06, 135319.35, 129471.49, 123335.4, 117044.06, 110718, 104462.21, 98364.54, 92495.32, 86907.93,
  81640.16, 76715.96, 72147.47, 67937.09, 64079.46, 60563.32, 57373.05, 54490.13, 51894.21, 49564.05, 47478.22,
  45615.66, 43956.02, 42480, 41169.47, 40007.56, 38978.76, 38068.84, 37264.86, 36555.12, 35929.04, 35377.14, 34890.91,
  34462.77, 34085.94, 33754.42, 33462.85, 33206.5, 32981.18, 32783.18, 32609.22, 32456.41, 32322.2, 32204.35, 32100.87,
  32010.02, 31930.27, 31860.26, 31798.82, 31744.89, 31697.56, 31656.03, 31619.58, 31587.6, 31559.53, 17864.18,
];

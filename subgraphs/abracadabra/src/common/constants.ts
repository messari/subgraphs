import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
  export const FIXED_TERM = "FIXED";
}
export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROW = "BORROWER";
}
export namespace EventType {
  export const BORROW = "BORROW";
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const REPAY = "REPAY";
  export const LIQUIDATEE = "LIQUIDATEE";
  export const LIQUIDATOR = "LIQUIDATOR";
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
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const NEG_INT_ONE = -1 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_ONE_HUNDRED = new BigDecimal(BigInt.fromI32(100));

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 360
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_YEAR = new BigDecimal(BigInt.fromI32(60 * 60 * 24 * 365));
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const BENTOBOX_ADDRESS_MAINNET = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966".toLowerCase();
export const BENTOBOX_ADDRESS_AVALANCHE = "0xf4F46382C2bE1603Dc817551Ff9A7b333Ed1D18f".toLowerCase();
export const BENTOBOX_ADDRESS_ARBITRUM = "0x74c764D41B77DBbb4fe771daB1939B00b146894A".toLowerCase();
export const BENTOBOX_ADDRESS_FANTOM = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966".toLowerCase();
export const BENTOBOX_ADDRESS_BSC = "0x090185f2135308BaD17527004364eBcC2D37e5F6".toLowerCase();

export const DEGENBOX_ADDRESS_MAINNET = "0xd96f48665a1410C0cd669A88898ecA36B9Fc2cce".toLowerCase();
export const DEGENBOX_ADDRESS_AVALANCHE = "0x1fC83f75499b7620d53757f0b01E2ae626aAE530".toLowerCase();
export const DEGENBOX_ADDRESS_ARBITRUM = ZERO_ADDRESS;
export const DEGENBOX_ADDRESS_FANTOM = "0x74A0BcA2eeEdf8883cb91E37e9ff49430f20a616".toLowerCase();
export const DEGENBOX_ADDRESS_BSC = ZERO_ADDRESS;

export const ABRA_ACCOUNTS = [
  // same on all chains
  "0xfddfe525054efaad204600d00ca86adb1cc2ea8a".toLowerCase(),
  "0xb4EfdA6DAf5ef75D08869A0f9C0213278fb43b6C".toLowerCase(),
];

export const MIM_MAINNET = "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3".toLowerCase();
export const MIM_AVALANCHE = "0x130966628846bfd36ff31a822705796e8cb8c18d".toLowerCase();
export const MIM_ARBITRUM = "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a".toLowerCase();
export const MIM_FANTOM = "0x82f0b8b456c1a451378467398982d4834b6829c1".toLowerCase();
export const MIM_BSC = "0xfe19f0b51438fd612f6fd59c1dbb3ea319f433ba".toLowerCase();

export const STAKED_SPELL_MAINNET = "0x26FA3fFFB6EfE8c1E69103aCb4044C26B9A106a9".toLowerCase();
export const STAKED_SPELL_AVALANCHE = "0x3Ee97d514BBef95a2f110e6B9b73824719030f7a".toLowerCase();
export const STAKED_SPELL_ARBITRUM = "0xF7428FFCb2581A2804998eFbB036A43255c8A8D3".toLowerCase();
export const STAKED_SPELL_FANTOM = "0xbB29D2A58d880Af8AA5859e30470134dEAf84F2B".toLowerCase();

export const YV_USDT_MARKET = "0x551a7cff4de931f32893c928bbc3d25bf1fc5147".toLowerCase();
export const YV_WETH_MARKET = "0x6Ff9061bB8f97d948942cEF376d98b51fA38B91f".toLowerCase();
export const YV_YFI_MARKET = "0xffbf4892822e0d552cff317f65e1ee7b5d3d9ae6".toLowerCase();
export const YV_USDC_MARKET = "0x6cbafee1fab76ca5b5e144c43b3b50d42b7c8c8f".toLowerCase();
export const XSUSHI_MARKET = "0xbb02a884621fb8f5bfd263a67f58b65df5b090f3".toLowerCase();

export const COLLATERIZATION_RATE_PRECISION = 5;

export const LOW_RISK_COLLATERAL_RATE = 90000;
export const HIGH_RISK_COLLATERAL_RATE = 75000;
export const STABLE_RISK_COLLATERAL_RATE = 100000;
export const LOW_RISK_INTEREST_RATE = 253509908;
export const HIGH_RISK_INTEREST_RATE = 475331078;
export const LOW_RISK_LIQUIDATION_PENALTY = 103000;
export const HIGH_RISK_LIQUIDATION_PENALTY = 112500;

export const ABRA_USER_REVENUE_SHARE = BigDecimal.fromString("0.75");
export const ABRA_PROTOCOL_REVENUE_SHARE = BigDecimal.fromString("0.25");

export const CHAINLINK_ORACLE_DECIMALS = 8 as i32;

export const ETH_NETWORK = "mainnet";
export const FTM_NETWORK = "fantom";
export const ARB_NETWORK = "arbitrum-one";
export const BSC_NETWORK = "bsc";
export const AVALANCHE_NETWORK = "avalanche";

export const schemaVersion = "2.0.1";
export const subgraphVersion = "1.2.0";
export const methodologyVersion = "1.0.0";

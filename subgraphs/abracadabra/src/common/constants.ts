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

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_YEAR = new BigDecimal(BigInt.fromI32(60 * 60 * 24 * 365));
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const BENTOBOX_ADDRESS = "0xF5BCE5077908a1b7370B9ae04AdC565EBd643966".toLowerCase();

export const ABRA_ACCOUNTS = [
  "0xfddfe525054efaad204600d00ca86adb1cc2ea8a".toLowerCase(),
  "0xb4EfdA6DAf5ef75D08869A0f9C0213278fb43b6C".toLowerCase(),
];

export const MIM = "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3".toLowerCase();

export const MIM_PRICE_ORACLE = "0x7A364e8770418566e3eb2001A96116E6138Eb32F".toLowerCase();
export const SPELL = "0x090185f2135308BaD17527004364eBcC2D37e5F6".toLowerCase();
export const STAKED_SPELL = "0x26FA3fFFB6EfE8c1E69103aCb4044C26B9A106a9".toLowerCase();
export const TREASURY_ADDRESS = "0x5a7c5505f3cfb9a0d9a8493ec41bf27ee48c406d".toLowerCase();
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

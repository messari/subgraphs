import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Vesta Finance";
export const PROTOCOL_SLUG = "vesta-finance";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They also correspond to the ones in `dataSource.network()` after converting to lower case.
// See below for a complete list:
// https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const AURORA = "AURORA";
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
  export const FIXED = "FIXED";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace PositionSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const gOHM_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

export const EMPTY_STRING = "";

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const STABILITY_POOL_MANAGER =
  "0x8aa2e4b1e9a626954b183966eb6665543c03f386";

export const TROVE_MANAGER = "0x100ec08129e0fd59959df93a8b914944a3bbd5df";

export const VESTA_PARAMETERS_ADDRESS =
  "0x5f51b0a5e940a3a20502b5f59511b13788ec6ddb";

export const PRICE_ORACLE_V1_ADDRESS =
  "0xc93408bfbea0bf3e53bedbce7d5c1e64db826702";

export const VST_ADDRESS = "0x64343594ab9b56e99087bfa6f2335db24c2d1f17";
export const VSTA_ADDRESS = "0xa684cd057951541187f288294a1e1c2646aa2d24";
export const WETH_ADDRESS = "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
export const USDC_ADDRESS = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
export const gOHM_ADDRESS = "0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1";
export const BAL_VSTA_WETH_POOL_ADDRESS =
  "0xc61ff48f94d801c1ceface0289085197b5ec44f0";
export const BAL_WETH_WBTC_USDC_POOL_ADDRESS =
  "0x64541216bafffeec8ea535bb71fbc927831d0595";
export const BAL_VST_DAI_USDT_USDC_POOL_ADDRESS =
  "0x5a5884fc31948d59df2aeccca143de900d49e1a3";
export const SUSHI_gOHM_WETH_PAIR_ADDRESS =
  "0xaa5bd49f2162ffdc15634c87a77ac67bd51c6a6d";
export const SUSHI_WETH_USDC_PAIR_ADDRESS =
  "0x905dfcd5649217c42684f23958568e533c711aa3";

export const ACTIVE_POOL_ADDRESS = "0xbe3de7fb9aa09b3fa931868fb49d5ba5fee2ebb1";
export const ACTIVE_POOL_CREATED_TIMESTAMP = BigInt.fromI32(1644224579);
export const ACTIVE_POOL_CREATED_BLOCK = BigInt.fromI32(5559192);
export const VSTA_BALANCER_POOL_CREATED_BLOCK = BigInt.fromI32(5671673);
export const VST_BALANCER_POOL_CREATED_BLOCK = BigInt.fromI32(9455379);

export const MINIMUM_COLLATERAL_RATIO = BigDecimal.fromString("1.1");
export const MAXIMUM_LTV = BIGDECIMAL_HUNDRED.div(MINIMUM_COLLATERAL_RATIO);

export const LIQUIDATION_FEE_PERCENT = BigDecimal.fromString("0.5");
export const LIQUIDATION_FEE = LIQUIDATION_FEE_PERCENT.div(BIGDECIMAL_HUNDRED);

export const LIQUIDATION_RESERVE_VST = BigDecimal.fromString("30");

export const BONUS_TO_SP = BigDecimal.fromString("10");

export const MINUTES_PER_DAY = BigInt.fromI32(24 * 60);

export const STABILITYPOOL_ASSET = "StabilityPool_Asset";

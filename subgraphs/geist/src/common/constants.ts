import { 
    BigInt, 
    BigDecimal,
    Address,
} from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
// They are mainly intended for convenience on the data consumer side.
// The enum values are derived from Coingecko slugs (converted to uppercase
// and replaced hyphens with underscores for Postgres enum compatibility)
export namespace SchemaNetwork {
    export const ARBITRUM = "ARBITRUM_ONE";
    export const AVALANCHE = "AVALANCHE";
    export const AURORA = "AURORA";
    export const BSC = "BINANCE_SMART_CHAIN";
    export const CELO = "CELO";
    export const ETHEREUM = "ETHEREUM";
    export const FANTOM = "FANTOM";
    export const FUSE = "FUSE";
    export const MOONBEAM = "MOONBEAM";
    export const MOONRIVER = "MOONRIVER";
    export const NEAR = "NEAR";
    export const OPTIMISM = "OPTIMISTIC_ETHEREUM";
    export const POLYGON = "POLYGON_POS";
    export const XDAI = "XDAI";
}
  
  // The network names corresponding to the ones in `dataSource.network()`
  // They should mainly be used for the ease of comparison.
  // Note that they cannot be used as enums since they are lower case.
  // See below for a complete list:
  // https://thegraph.com/docs/en/hosted-service/what-is-hosted-service/#supported-networks-on-the-hosted-service
export namespace SubgraphNetwork {
    export const ARBITRUM = "arbitrum-one";
    export const AVALANCHE = "avalanche";
    export const AURORA = "aurora";
    export const BSC = "bnb";
    export const CELO = "celo";
    export const ETHEREUM = "mainnet";
    export const FANTOM = "fantom";
    export const FUSE = "fuse";
    export const MOONBEAM = "moonbeam";
    export const MOONRIVER = "moonriver";
    export const NEAR = "near-mainnet";
    export const OPTIMISM = "optimism";
    export const POLYGON = "matic";
    export const XDAI = "xdai";
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

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////
export const ZERO_ADDRESS = Address.fromString("0x0000000000000000000000000000000000000000")



////////////////////////
///// Type Helpers /////
////////////////////////

// BigInts
export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString('10').pow(18);
export const BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);
export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;
export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

// BigDecimal 0 and 1
export const ZERO_BD = BigDecimal.fromString("0");
export const ONE_BD = BigDecimal.fromString("1");
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);


export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 86400; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(86400000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(86400000)));

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

// Set Protocol ID to the registry address
export const PROTOCOL_ID = "0x4CF8E50A5ac16731FA2D8D9591E195A285eCaA82";

// Interaction types for snapshot calculations
export const DEPOSIT_INTERACTION = "DEPOSIT";
export const WITHDRAW_INTERACTION = "WITHDRAW";
export const BORROW_INTERACTION = "BORROW";
export const REWARD_INTERACTION = "REWARD";
export const REPAY_INTERACTION = "REPAY";
export const STAKE_INTERACTION = "STAKE";
export const UNSTAKE_INTERACTION = "UNSTAKE";
export const LIQUIDATION_INTERACTION = "LIQUIDATION";

export const SUBGRAPH_VERSION = '0.0.8';
export const SCHEMA_VERSION = '0.0.8';
export const PROTOCOL_NAME = 'Geist-Finance';
export const PROTOCOL_SLUG = 'geist-finance';
export const LENDING_TYPE = 'POOLED';
export const RISK_TYPE = 'ISOLATED';

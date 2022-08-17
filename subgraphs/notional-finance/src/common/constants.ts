import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

///////////////////
///// Versions /////
////////////////////

export const PROTOCOL_SCHEMA_VERSION = "1.3.0";
export const PROTOCOL_SUBGRAPH_VERSION = "1.1.0";
export const PROTOCOL_METHODOLOGY_VERSION = "1.0.0";

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
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
  export const BSC = "BSC"; // aka BNB Chain
  export const CELO = "CELO";
  export const COSMOS = "COSMOS";
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
  export const CRONOS = "CRONOS"; // Crypto.com Cronos chain
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE";
  export const LENDING = "LENDING";
  export const YIELD = "YIELD";
  export const BRIDGE = "BRIDGE";
  export const GENERIC = "GENERIC";
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

// export namespace EventType {
export namespace TransactionType {
  export const BORROW = "BORROW";
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const REPAY = "REPAY";
  export const LIQUIDATEE = "LIQUIDATEE";
  export const LIQUIDATOR = "LIQUIDATOR";
}

////////////////////////////
///// Solifidity Enums /////
////////////////////////////

export namespace PoolState {
  export const Initialized: i32 = 0;
  export const Finalized: i32 = 1;
  export const Deactivated: i32 = 2;
}

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = Address.zero();
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";
export const UNPROVIDED_NAME: string = "NOT_PROVIDED";

export const cETH_ADDRESS = "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5";
export const cDAI_ADDRESS = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
export const cUSDC_ADDRESS = "0x39AA39c021dfbaE8faC545936693aC917d5E7563";
export const cWBTC_ADDRESS = "0xC11b1268C1A384e55C48c2391d8d480264A3A7F4";

////////////////////////
///// Type Helpers /////
////////////////////////

export const DEFAULT_DECIMALS = 18;

export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TWO = BigInt.fromI32(2);
export const BIGINT_HUNDRED = BigInt.fromI32(100);
export const BIGINT_THOUSAND = BigInt.fromI32(1000);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);
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

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 360
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_YEAR = new BigDecimal(
  BigInt.fromI32(60 * 60 * 24 * 365)
);
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

// metadata
export const PROTOCOL_NAME = "Notional v2";
export const PROTOCOL_SLUG = "notional-v2";
export const PROTOCOL_NETWORK = Network.MAINNET;

// lending
export const PROTOCOL_TYPE = ProtocolType.LENDING;
export const PROTOCOL_LENDING_TYPE = LendingType.POOLED;
export const PROTOCOL_RISK_TYPE = RiskType.ISOLATED;
export const PROTOCOL_INTEREST_RATE_TYPE = InterestRateType.FIXED;
export const PROTOCOL_INTEREST_RATE_SIDE = InterestRateSide.BORROWER;

// treasury
// export const PROTOCOL_INITIAL_TREASURY_FEE = BigDecimal.fromString("0.005");
// export const PROTOCOL_GLOBAL_PARAMS_TREASURY_FEE_KEY = "TREASURY_FEE";

// contracts/addresses
export const PROTOCOL_ID = "0x1344A36A1B56144C3Bc62E7757377D288fDE0369";

// markets
export namespace PoolId {
  export const ETH_POOL = 1;
  export const DAI_POOL = 2;
  export const USDC_POOL = 3;
  export const WBTC_POOL = 4;
}

import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { prefixID } from "./strings";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Saddle Finance";
export const PROTOCOL_SLUG = "saddle-finance";
export const PROTOCOL_SCHEMA_VERSION = "1.2.1";
export const PROTOCOL_SUBGRAPH_VERSION = "1.0.0";
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

export namespace UsageType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
  export const SWAP = "SWAP";
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

export const DEPLOYER_ADDRESS = "0x5bdb37d0ddea3a90f233c7b7f6b9394b6b2eef34";
export const FEE_PRECISION = 10 as i32;

export const BROKEN_POOLS = new Set<string>();
BROKEN_POOLS.add("0x2334b53ce1309e83a889c337d9422a2a3953dd5a");
BROKEN_POOLS.add("0xa2c27d1cad627f0ec39a18bd305e13731a948e92");

class PoolData {
  createdTimestamp: BigInt;
  createdBlockNumber: BigInt;
}

export const POOL_DATA = new Map<string, PoolData>();
// BTCv1
POOL_DATA.set(
  prefixID(Network.MAINNET, "0x4f6a43ad7cba042606decaca730d4ce0a57ac62e"),
  {
    createdTimestamp: BigInt.fromI64(1611057088),
    createdBlockNumber: BigInt.fromI64(11685572),
  }
);
// sUSD Meta v1
POOL_DATA.set(
  prefixID(Network.MAINNET, "0x0c8bae14c9f9bf2c953997c881befac7729fd314"),
  {
    createdTimestamp: BigInt.fromI64(1627451981),
    createdBlockNumber: BigInt.fromI64(12912720),
  }
);
// wCUSD Meta v1
POOL_DATA.set(
  prefixID(Network.MAINNET, "0x3f1d224557afa4365155ea77ce4bc32d5dae2174"),
  {
    createdTimestamp: BigInt.fromI64(1630728602),
    createdBlockNumber: BigInt.fromI64(13156995),
  }
);
// sUSD Meta v2
POOL_DATA.set(
  prefixID(Network.MAINNET, "0x824dcd7b044d60df2e89b1bb888e66d8bcf41491"),
  {
    createdTimestamp: BigInt.fromI64(1639529917),
    createdBlockNumber: BigInt.fromI64(13806669),
  }
);
// ftmUSD (Fantom)
POOL_DATA.set(
  prefixID(Network.FANTOM, "0xbea9f78090bdb9e662d8cb301a00ad09a5b756e9"),
  {
    createdTimestamp: BigInt.fromI64(1642808458),
    createdBlockNumber: BigInt.fromI64(28679173),
  }
);
// arbUSD (Arbitrum)
POOL_DATA.set(
  prefixID(Network.ARBITRUM_ONE, "0xbea9f78090bdb9e662d8cb301a00ad09a5b756e9"),
  {
    createdTimestamp: BigInt.fromI64(1637038159),
    createdBlockNumber: BigInt.fromI64(3073795),
  }
);
// FRAX (Arbitrum)
POOL_DATA.set(
  prefixID(Network.ARBITRUM_ONE, "0xfeea4d1bacb0519e8f952460a70719944fe56ee0"),
  {
    createdTimestamp: BigInt.fromI64(1640123527),
    createdBlockNumber: BigInt.fromI64(4006435),
  }
);
// USDs Meta (Arbitrum)
POOL_DATA.set(
  prefixID(Network.ARBITRUM_ONE, "0x5dd186f8809147f96d3ffc4508f3c82694e58c9c"),
  {
    createdTimestamp: BigInt.fromI64(1643930648),
    createdBlockNumber: BigInt.fromI64(5401331),
  }
);
// optUSD (Optimism)
POOL_DATA.set(
  prefixID(Network.OPTIMISM, "0x5847f8177221268d279cf377d0e01ab3fd993628"),
  {
    createdTimestamp: BigInt.fromI64(1642521534),
    createdBlockNumber: BigInt.fromI64(2404204),
  }
);
// FRAX Meta (Optimism)
POOL_DATA.set(
  prefixID(Network.OPTIMISM, "0xc55e8c79e5a6c3216d4023769559d06fa9a7732e"),
  {
    createdTimestamp: BigInt.fromI64(1642521534),
    createdBlockNumber: BigInt.fromI64(2404225),
  }
);

import { BigDecimal, BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import { RocketStorage } from "../../generated/rocketTokenRETH/RocketStorage";
import { Versions } from "../versions";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "RocketPool";
export const PROTOCOL_SLUG = "RocketPool";
export const PROTOCOL_SCHEMA_VERSION = Versions.getSchemaVersion();
export const PROTOCOL_SUBGRAPH_VERSION = Versions.getSubgraphVersion();
export const PROTOCOL_METHODOLOGY_VERSION = Versions.getMethodologyVersion();

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
export const BIGINT_NEGATIVE_ONE = BigInt.fromI32(-1);
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
export const BIGDECIMAL_HALF = new BigDecimal(BIGINT_ONE).div(
  new BigDecimal(BIGINT_TWO)
);
export const ONE_ETH_IN_WEI = BigInt.fromString("1000000000000000000");
export const BIGINT_SIXTEEN = BigInt.fromI32(16).times(ONE_ETH_IN_WEI);
export const BIGINT_THIRTYTWO = BigInt.fromI32(32).times(ONE_ETH_IN_WEI);

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
export const RETH_NAME = "RETH";
/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

// steth / Reth address
export const RETH_ADDRESS = "0xae78736Cd615f374D3085123A210448E74Fc6393";

export const RPL_ADDRESS = "0xD33526068D116cE69F19A9ee46F0bd304F21A51f";

// deposits address
export const DEPOSITPOOL = "0x4D05E3d48a938db4b7a9A59A802D5b45011BDe58";

export const STORAGE = "0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46";

export const FEESENCODE = Bytes.fromHexString(
  "0x034cd2ba322813e095f0f5279fe7959f6a89e44e2f0f497703d997c9bc1ba0e0"
);

export const PRICEENCODE = Bytes.fromHexString(
  "0xf0de2459ea3014c17544dae653d0a2712abaa43f062fbd0b6da8e03cf5a97356"
);

export const NODEDEPOSIT_ENCODE = Bytes.fromHexString(
  "0xc5f0e8e643416573963c05884a77dfc5eba3461eb8d39b60a0a58aedca955fa5"
);

export const NETWORKBALANCES_ENCODE = Bytes.fromHexString(
  "0x7630e125f1c009e5fc974f6dae77c6d5b1802979b36e6d7145463c21782af01e"
);

export const DEFAULT_COMMISSION = BigDecimal.fromString("0.15");
export function getStorageAddress(encode: Bytes): Address {
  const storage = RocketStorage.bind(Address.fromString(STORAGE));
  const address = storage.try_getAddress(encode);
  if (address.reverted) {
    return Address.fromString("0x0000000000000000000000000000000000000000");
  } else {
    return Address.fromBytes(address.value);
  }
}

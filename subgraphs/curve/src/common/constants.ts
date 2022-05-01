import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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

//////////////////////////////
///// Ethereum Addresses /////
//////////////////////////////

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE".toLowerCase();

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
export const BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

////////////////
///// Misc /////
////////////////

export const ETH_SYMBOL = "ETH";
export const ETH_NAME = "Ether";

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const REGISTRY_ADDRESS = "0x90e00ace148ca3b23ac1bc8c240c2a7dd9c2d7f5".toLowerCase();
export const BIGINT_CRV_LP_TOKEN_DECIMALS = BigInt.fromI32(1000000);

export const ASSET_TYPES = new Map<string, i32>();
ASSET_TYPES.set("0x06364f10b501e868329afbc005b3492902d6c763", 0);
ASSET_TYPES.set("0x071c661b4deefb59e2a3ddb20db036821eee8f4b", 2);
ASSET_TYPES.set("0x0ce6a5ff5217e38315f87032cf90686c96627caa", 3);
ASSET_TYPES.set("0x0f9cb53ebe405d49a0bbdbd291a65ff571bc83e1", 0);
ASSET_TYPES.set("0x2dded6da1bf5dbdf597c45fcfaa3194e53ecfeaf", 0);
ASSET_TYPES.set("0x3e01dd8a5e1fb3481f0f589056b428fc308af0fb", 0);
ASSET_TYPES.set("0x3ef6a01a0f81d6046290f3e2a8c5b843e738e604", 0);
ASSET_TYPES.set("0x42d7025938bec20b69cbae5a77421082407f053a", 0);
ASSET_TYPES.set("0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c", 0);
ASSET_TYPES.set("0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51", 0);
ASSET_TYPES.set("0x4807862aa8b2bf68830e4c8dc86d0e9a998e085a", 0);
ASSET_TYPES.set("0x4ca9b3063ec5866a4b82e437059d2c43d1be596f", 2);
ASSET_TYPES.set("0x4f062658eaaf2c1ccf8c8e36d6824cdf41167956", 0);
ASSET_TYPES.set("0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c", 0);
ASSET_TYPES.set("0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27", 0);
ASSET_TYPES.set("0x7f55dde206dbad629c080068923b36fe9d6bdbef", 2);
ASSET_TYPES.set("0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714", 2);
ASSET_TYPES.set("0x8038c01a0390a8c547446a0b2c18fc9aefecc10c", 0);
ASSET_TYPES.set("0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5", 4);
ASSET_TYPES.set("0x8474ddbe98f5aa3179b3b3f5942d724afcdec9f6", 0);
ASSET_TYPES.set("0x890f4e345b1daed0367a877a1612f86a1f86985f", 0);
ASSET_TYPES.set("0x93054188d876f558f4a66b2ef1d97d16edf0895b", 2);
ASSET_TYPES.set("0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56", 0);
ASSET_TYPES.set("0xa5407eae9ba41422680e2e00537571bcc53efbfd", 0);
ASSET_TYPES.set("0xa96a65c051bf88b4095ee1f2451c2a9d43f53ae2", 1);
ASSET_TYPES.set("0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7", 0);
ASSET_TYPES.set("0xc18cc39da8b11da8c3541c598ee022258f9744da", 0);
ASSET_TYPES.set("0xc25099792e9349c7dd09759744ea681c7de2cb66", 2);
ASSET_TYPES.set("0xc5424b857f758e906013f3555dad202e4bdb4567", 1);
ASSET_TYPES.set("0xd51a44d3fae010294c616388b506acda1bfaae46", 0);
ASSET_TYPES.set("0xd632f22692fac7611d2aa1c0d552930d43caed3b", 0);
ASSET_TYPES.set("0xd81da8d904b52208541bade1bd6595d8a251f8dd", 2);
ASSET_TYPES.set("0xdc24316b9ae028f1497c275eb9192a3ea0f67022", 1);
ASSET_TYPES.set("0xdebf20617708857ebe4f679508e7b7863a8a8eee", 0);
ASSET_TYPES.set("0xeb16ae0052ed37f479f7fe63849198df1765a733", 0);
ASSET_TYPES.set("0xecd5e75afb02efa118af914515d6521aabd189f1", 0);
ASSET_TYPES.set("0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca", 0);
ASSET_TYPES.set("0xf178c0b5bb7e7abf4e12a4838c7b7c5ba2c623c0", 3);
ASSET_TYPES.set("0xf9440930043eb3997fc70e1339dbb11f341de7a8", 1);
ASSET_TYPES.set("0xfd5db7463a3ab53fd211b4af195c5bccc1a03890", 3);
ASSET_TYPES.set("0x9d0464996170c6b9e75eed71c68b99ddedf279e8", 3);
ASSET_TYPES.set("0xc4c319e2d4d66cca4464c0c2b32c9bd23ebe784e", 1);
ASSET_TYPES.set("0xfbdca68601f835b27790d98bbb8ec7f05fdeaa9b", 2);

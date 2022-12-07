import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////
///// Versions /////
////////////////////

export const PROTOCOL_NAME = "Goldfinch";
export const PROTOCOL_SLUG = "goldfinch";
export namespace Network {
  export const ARBITRUM_ONE = "ARBITRUM_ONE";
  export const ARWEAVE_MAINNET = "ARWEAVE_MAINNET";
  export const AURORA = "AURORA";
  export const AVALANCHE = "AVALANCHE";
  export const BOBA = "BOBA";
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

export namespace LendingType {
  export const CDP = "CDP";
  export const POOLED = "POOLED";
}

export namespace RiskType {
  export const GLOBAL = "GLOBAL";
  export const ISOLATED = "ISOLATED";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
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

export namespace PositionSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

////////////////////////
///// Type Helpers /////
////////////////////////

export const INT_NEGATIVE_ONE = -1 as i32;
export const INT_ZERO = 0 as i32;
export const INT_ONE = 1 as i32;
export const INT_TWO = 2 as i32;
export const INT_FOUR = 4 as i32;

export const BIGINT_ZERO = BigInt.fromI32(0);
export const BIGINT_ONE = BigInt.fromI32(1);
export const BIGINT_TEN_TO_EIGHTEENTH = BigInt.fromString("10").pow(18);

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_HUNDRED = new BigDecimal(BigInt.fromI32(100));

/////////////////////
///// Date/Time /////
/////////////////////

export const DAYS_PER_YEAR = 365;
export const SECONDS_PER_YEAR = 60 * 60 * 24 * DAYS_PER_YEAR;
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const SECONDS_PER_HOUR = 60 * 60; // 3600

export const ETHEREUM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 13; // 13 = seconds per block
export const AVALANCHE_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 2; // 2 = seconds per block. This is NOT ideal since avalanche has variable block time.
export const FANTOM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 1; // 1 = seconds per block. This is NOT ideal since fantom has variable block time.
export const BSC_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 3; // 3 = seconds per block
export const MATIC_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 2; // 2 = seconds per block
export const ARBITRUM_BLOCKS_PER_YEAR = SECONDS_PER_YEAR / 1; // 1 = seconds per block. This is NOT ideal since fantom has variable block time.

export const V2_2_MIGRATION_TIME = "1643943600";
export const BACKER_REWARDS_EPOCH = "1644021439";
export const FIDU_DECIMALS = BigDecimal.fromString("1000000000000000000"); // 18 zeroes
export const GFI_DECIMALS = BigDecimal.fromString("1000000000000000000"); // 18 zeroes
export const USDC_DECIMALS = BigDecimal.fromString("1000000"); // 6 zeroes

// This config represents the enum config on protocol/core/ConfigOptions.sol where order is fixed
// (search for `library ConfigOptions` and `CONFIG_KEYS_BY_TYPE`)
export enum CONFIG_KEYS_NUMBERS {
  TransactionLimit = 0,
  TotalFundsLimit = 1,
  MaxUnderwriterLimit = 2,
  ReserveDenominator = 3,
  WithdrawFeeDenominator = 4,
  LatenessGracePeriodInDays = 5,
  LatenessMaxDays = 6,
  DrawdownPeriodInSeconds = 7,
  TransferRestrictionPeriodInDays = 8,
  LeverageRatio = 9,
}
export enum CONFIG_KEYS_ADDRESSES {
  Pool = 0,
  CreditLineImplementation = 1,
  GoldfinchFactory = 2,
  CreditDesk = 3,
  Fidu = 4,
  USDC = 5,
  TreasuryReserve = 6,
  ProtocolAdmin = 7,
  OneInch = 8,
  // TrustedForwarder is deprecated because we no longer use GSN
  TrustedForwarder = 9,
  CUSDCContract = 10,
  GoldfinchConfig = 11,
  PoolTokens = 12,
  TranchedPoolImplementation = 13,
  SeniorPool = 14,
  SeniorPoolStrategy = 15,
  MigratedTranchedPoolImplementation = 16,
  BorrowerImplementation = 17,
  GFI = 18,
  Go = 19,
  BackerRewards = 20,
  StakingRewards = 21,
}

////////////////////////
///// ADDRESSES /////
////////////////////////

export const FACTORY_ADDRESS = "0xd20508e1e971b80ee172c73517905bfffcbd87f9";
export const SENIOR_POOL_ADDRESS = "0x8481a6ebaf5c7dabc3f7e09e44a89531fd31f822";
export const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
export const FIDU_ADDRESS = "0x6a445e9f40e0b97c92d0b8a3366cef1d67f700bf";
export const GFI_ADDRESS = "0xdab396ccf3d84cf2d07c4454e10c8a6f5b008d2b";
export const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const STAKING_REWARDS_ADDRESS =
  "0xfd6ff39da508d281c2d255e9bbbfab34b6be60c3";
export const POOL_TOKENS_ADDRESS = "0x57686612c601cb5213b01aa8e80afeb24bbd01df";
export const WETH_GFI_UniswapV2_Pair =
  "0xa0ce0b8fdbed2b63a28e4f2d23e075c7f16a8259";
export const USDC_WETH_UniswapV2_Pair =
  "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";

export const INVALID_POOLS = new Set<string>();
INVALID_POOLS.add("0x0e2e11dc77bbe75b2b65b57328a8e4909f7da1eb");
INVALID_POOLS.add("0x4b2ae066681602076adbe051431da7a3200166fd");
INVALID_POOLS.add("0x6b42b1a43abe9598052bb8c21fd34c46c9fbcb8b");
INVALID_POOLS.add("0x7bdf2679a9f3495260e64c0b9e0dfeb859bad7e0");
INVALID_POOLS.add("0x95715d3dcbb412900deaf91210879219ea84b4f8");
INVALID_POOLS.add("0xa49506632ce8ec826b0190262b89a800353675ec");
INVALID_POOLS.add("0xfce88c5d0ec3f0cb37a044738606738493e9b450");
INVALID_POOLS.add("0x294371f9ec8b6ddf59d4a2ceba377d19b9735d34");

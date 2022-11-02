import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

// The network names corresponding to the Network enum in the schema.
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
  export const FIXED_TERM = "FIXED_TERM";
}

export namespace InterestRateSide {
  export const LENDER = "LENDER";
  export const BORROWER = "BORROWER";
}

export namespace TransactionType {
  export const DEPOSIT = "DEPOSIT";
  export const WITHDRAW = "WITHDRAW";
}

export namespace RariPool {
  export const YIELD_POOL = "Yield Pool";
  export const STABLE_POOL = "Stable Pool"; // USDC and DAI
  export const ETHER_POOL = "Ether Pool";
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
export const ETH_NAME = "Ether";
export const ETH_SYMBOL = "ETH";

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
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

export const INT_ZERO = BIGINT_ZERO.toI32();
export const INT_ONE = BIGINT_ONE.toI32();
export const INT_TWO = BIGINT_TWO.toI32();

export const BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export const BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const BIGDECIMAL_TWO = new BigDecimal(BIGINT_TWO);

export const MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));

/////////////////////
///// Date/Time /////
/////////////////////

export const SECONDS_PER_HOUR = 60 * 60; // 3600
export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);
export const BLOCKS_PER_YEAR = BigDecimal.fromString("2102400");

///////////////////////////
//// Rari Input Tokens ////
///////////////////////////

// Note: Deposit/Withdrawal events store the asset as an indexed string
// This means the asset symbol is hashed using keccak256 and the result is stored in the transaction logs
// Learn more here: https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378

export const TOKEN_MAPPING = new Map<string, string>();
TOKEN_MAPPING.set(
  "0xa5e92f3efb6826155f1f728e162af9d7cda33a574a1153b58f03ea01cc37e568",
  "0x6B175474E89094C44Da98b954EedeAC495271d0F"
); // DAI
TOKEN_MAPPING.set(
  "0xd6aca1be9729c13d677335161321649cccae6a591554772516700f986f942eaa",
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
); // USDC
TOKEN_MAPPING.set(
  "0x8b1a1d9c2b109e527c9134b25b1a1833b16b6594f92daa9f6d9b7a6024bce9d0",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7"
); // USDT
TOKEN_MAPPING.set(
  "0xa1b8d8f7e538bb573797c963eeeed40d0bcb9f28c56104417d0da1b372ae3051",
  "0x0000000000085d4780B73119b644AE5ecd22b376"
); // TUSD
TOKEN_MAPPING.set(
  "0x54c512ac779647672b8d02e2fe2dc10f79bbf19f719d887221696215fd24e9f1",
  "0x4Fabb145d64652a948d72533023f6E7A623C7C53"
); //BUSD
TOKEN_MAPPING.set(
  "0x87ef9bf44f9ed3d4aeadafb38d9bc9470e7aac44fdcb9f7ffb957b862954cf2c",
  "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51"
); // sUSD
TOKEN_MAPPING.set(
  "0x33d80a03b5585b94e68b56bdea4f57fd2e459401902cb2f61772e1b630afb4b2",
  "0xe2f2a5C287993345a840Db3B0845fbC70f5935a5"
); // mUSD

//////////////////////////////////
//// Rari Yield Pool Specific ////
//////////////////////////////////

export const YIELD_VAULT_ADDRESS = "0x9245efB59f6491Ed1652c2DD8a4880cBFADc3ffA"; // RariPoolController.sol
export const YIELD_VAULT_MANAGER_ADDRESS =
  "0x59FA438cD0731EBF5F4cDCaf72D4960EFd13FCe6"; // RariPoolManager.sol
export const RARI_YIELD_POOL_TOKEN =
  "0x3baa6B7Af0D72006d3ea770ca29100Eb848559ae";

export const YIELD_VAULT_NAME = "Rari Yield Pool";
export const YIELD_VAULT_SYMBOL = "RYPT"; // RYPT = rari yield pool token ie, R(X)PT

/////////////////////////////////
//// Rari USDC Pool Specific ////
/////////////////////////////////

export const USDC_VAULT_ADDRESS = "0x66f4856f1bbd1eb09e1c8d9d646f5a3a193da569"; // RariPoolController.sol
export const USDC_VAULT_MANAGER_ADDRESS =
  "0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a"; // RariPoolManager.sol
export const RARI_STABLE_POOL_TOKEN =
  "0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0";

export const USDC_VAULT_NAME = "Rari USDC Pool";
export const USDC_VAULT_SYMBOL = "RSPT"; // RSPT = rari stable pool token

////////////////////////////////
//// Rari DAI Pool Specific ////
////////////////////////////////

export const DAI_VAULT_ADDRESS = "0xaFD2AaDE64E6Ea690173F6DE59Fc09F5C9190d74"; // RariPoolController.sol
export const DAI_VAULT_MANAGER_ADDRESS =
  "0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635"; // RariPoolManager.sol
export const RARI_DAI_POOL_TOKEN = "0x0833cfcb11A5ba89FbAF73a407831c98aD2D7648";

export const DAI_VAULT_NAME = "Rari DAI Pool";
export const DAI_VAULT_SYMBOL = "RDPT"; // RDPT = rari dai pool token

//////////////////////////////////
//// Rari Ether Pool Specific ////
//////////////////////////////////

export const ETHER_VAULT_ADDRESS = "0x3F4931A8E9D4cdf8F56e7E8A8Cfe3BeDE0E43657"; // RariPoolController.sol
export const ETHER_VAULT_MANAGER_ADDRESS =
  "0xD6e194aF3d9674b62D1b30Ec676030C23961275e"; // RariPoolManager.sol
export const RARI_ETHER_POOL_TOKEN =
  "0xCda4770d65B4211364Cb870aD6bE19E7Ef1D65f4";

export const ETHER_VAULT_NAME = "Rari Ether Pool";
export const ETHER_VAULT_SYMBOL = "REPT"; // REPT = rariether pool token

/////////////////////////////
///// Protocol Specific /////
/////////////////////////////

export const RARI_DEPLOYER = "0xb8f02248d53f7edfa38e79263e743e9390f81942"; // using as "protocol address" b/c no factory contract
export const PROTOCOL_NAME = "Rari Vaults";
export const PROTOCOL_SLUG = "rari-vaults";
export const PROTOCOL_NETWORK = Network.MAINNET;
export const PROTOCOL_TYPE = ProtocolType.YIELD;

import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

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
export namespace TransferType {
  export const MINT = "MINT";
  export const BURN = "BURN";
}

export namespace HelperStoreType {
  export const ETHER = 'ETHER'
  export const USERS = 'USERS'
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEFAULT_DECIMALS: i32 = 18;
export const HELPER_STORE_ID = "1"; // ID that track USD price of native token in helper store
export const FEE_DECIMALS = 10;
export const BSC_SECONDS_PER_BLOCK = BigInt.fromI32(5);
export const INT_ZERO: i32 = 0;
export const INT_ONE: i32 = 1;
export const INT_TWO: i32 = 2;
export const INT_FIVE: i32 = 5;
export const INT_TEN: i32 = 10;
export const INT_THOUSAND: i32 = 1000;
export const STRING_ZERO = "0";
export const STRING_ONE = "1";
export const STRING_TWO = "2";
export const STRING_TEN = "10";
export const STRING_HUNDRED = "100";
export let BIGINT_ZERO = BigInt.fromI32(INT_ZERO);
export let BIGINT_ONE = BigInt.fromI32(INT_ONE);
export let BIGINT_THOUSAND = BigInt.fromI32(INT_THOUSAND);
export let BIGDECIMAL_ZERO = BigDecimal.fromString(STRING_ZERO);
export let BIGDECIMAL_ONE = BigDecimal.fromString(STRING_ONE);
export let BIGDECIMAL_TWO = BigDecimal.fromString(STRING_TWO);
export let BIGDECIMAL_HUNDRED = BigDecimal.fromString(STRING_HUNDRED);

export const SECONDS_PER_DAY = 60 * 60 * 24;

export function toDecimal(value: BigInt, decimals: i32 = DEFAULT_DECIMALS): BigDecimal {
  let decimal = BigInt.fromI32(decimals);
  if (decimal == BIGINT_ZERO) {
    return value.toBigDecimal();
  }
  return value.toBigDecimal().div(exponentToBigDecimal(decimal));
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString(STRING_ONE);
  for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BigDecimal.fromString(STRING_TEN));
  }
  return bd;
}

// Converters
export function toBigInt(value: BigDecimal, decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return value.times(getPrecision(decimals).toBigDecimal()).truncate(INT_ZERO).digits;
}

// Helpers
export function getPrecision(decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return BigInt.fromI32(INT_TEN).pow((<u8>decimals) as u8);
}

export function toPercentage(n: BigDecimal): BigDecimal {
  return n.div(BigDecimal.fromString(STRING_HUNDRED));
}

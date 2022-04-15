import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISM";
  export const POLYGON = "POLYGON";
  export const XDAI = "XDAI";
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

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export namespace TransferType {
  export const MINT = "MINT";
  export const BURN = "BURN";
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

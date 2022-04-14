import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";

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
  export const POLYGON = "MATIC";
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

export namespace PoolType {
  export const META = "META";
  export const PLAIN = "PLAIN";
  export const LENDING = "LENDING";
}

export namespace LiquidityPoolFeeType {
  export const FIXED_TRADING_FEE = "FIXED_TRADING_FEE";
  export const TIERED_TRADING_FEE = "TIERED_TRADING_FEE";
  export const DYNAMIC_TRADING_FEE = "DYNAMIC_TRADING_FEE";
  export const FIXED_PROTOCOL_FEE = "FIXED_PROTOCOL_FEE";
  export const DYNAMIC_PROTOCOL_FEE = "DYNAMIC_PROTOCOL_FEE";
}

export function toDecimal(value: BigInt, decimals: i32 = DEFAULT_DECIMALS): BigDecimal {
  let decimal = BigInt.fromI32(decimals);
  if (decimal == BIGINT_ZERO) {
    return value.toBigDecimal();
  }
  return value.toBigDecimal().div(exponentToBigDecimal(decimal));
}

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = BIGINT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIGINT_ONE)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

// Converters
export function toBigInt(value: BigDecimal, decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return value.times(getPrecision(decimals).toBigDecimal()).truncate(0).digits;
}

// Helpers
export function getPrecision(decimals: i32 = DEFAULT_DECIMALS): BigInt {
  return BigInt.fromI32(10).pow((<u8>decimals) as u8);
}

export function toPercentage(n: BigDecimal): BigDecimal {
  return n.div(BigDecimal.fromString("100"));
}

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const FACTORY_ADDRESS = "0xf65BEd27e96a367c61e0E06C54e14B16b84a5870";
export let INT_ZERO: i32 = 0;
export let INT_ONE: i32 = 1;
export let INT_TWO: i32 = 2;
export let BIGINT_ZERO = BigInt.fromI32(INT_ZERO);
export let BIGINT_ONE = BigInt.fromI32(INT_ONE);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);
export const DEFAULT_DECIMALS = 18;
export const FEE_DENOMINATOR = BigInt.fromI32(10 ** 10);
export const FEE_DECIMALS = 10;
export const STAKERS_FEE_SHARE = toPercentage(BigDecimal.fromString('50'))
export const SUPPLY_FEE_SHARE = toPercentage(BigDecimal.fromString('50'))
export const SECONDS_PER_DAY = 60 * 60 * 24;

// create pool
export let factoryContract = Factory.bind(Address.fromString(FACTORY_ADDRESS));

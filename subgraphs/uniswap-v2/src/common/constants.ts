import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

export const PROTOCOL_ID = "1337"

export const NETWORK_ETHEREUM = "ETHEREUM"

export const PROTOCOL_TYPE_DEX_AMM = "DEX_AMM"
export const PROTOCOL_TYPE_LENDING = "LENDING"
export const PROTOCOL_TYPE_YIELD = "YIELD"

export const MANAGEMENT_FEE = "MANAGEMENT_FEE"
export const PERFORMANCE_FEE = "PERFORMANCE_FEE"
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("100000");
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_MAX = BigInt.fromString(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_ONE = new BigDecimal(BIGINT_ONE);

export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

///////
//////////////
///////

export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
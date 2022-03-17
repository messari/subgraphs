import { ethereum, BigDecimal, BigInt } from '@graphprotocol/graph-ts';

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const AVALANCHE = "AVALANCHE"
  export const AURORA = "AURORA"
  export const BSC = "BSC"
  export const CELO = "CELO"
  export const CRONOS = "CRONOS"
  export const ETHEREUM = "ETHEREUM"
  export const FANTOM = "FANTOM"
  export const HARMONY = "HARMONY"
  export const MOONBEAM = "MOONBEAM"
  export const MOONRIVER = "MOONRIVER"
  export const OPTIMISM = "OPTIMISM"
  export const POLYGON = "POLYGON"
  export const XDAI = "XDAI"
}

export namespace ProtocolType {
  export const EXCHANGE = "EXCHANGE"
  export const LENDING = "LENDING"
  export const YIELD = "YIELD"
  export const BRIDGE = "BRIDGE"
  export const GENERIC = "GENERIC"
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT"
  export const BORROW = "BORROW"
}

export function getOrNull<T>(result: ethereum.CallResult<T>): T | null {
  return result.reverted ? null : result.value
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const REGISTRY_ADDRESS = '0x0000000022d53366457f9d5e68ec105046fc4383'


export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("100000");
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_MAX = BigInt.fromString(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'
);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);


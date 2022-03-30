import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

////////////////////////
///// Schema Enums /////
////////////////////////

export namespace Network {
  export const ARBITRUM = "ARBITRUM_ONE";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BINANCE_SMART_CHAIN";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const ETHEREUM = "ETHEREUM";
  export const FANTOM = "FANTOM";
  export const HARMONY = "HARMONY_SHARD_0";
  export const MOONBEAM = "MOONBEAM";
  export const MOONRIVER = "MOONRIVER";
  export const OPTIMISM = "OPTIMISTIC_ETHEREUM";
  export const POLYGON = "POLYGON_POS";
  export const XDAI = "XDAI";
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
  export const TRADING_FEE = "TRADING_FEE";
  export const PROTOCOL_FEE = "PROTOCOL_FEE";
  export const TIERED_FEE = "TIERED_FEE";
  export const DYNAMIC_FEE = "DYNAMIC_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}
// Tokemak manager contract
export const PROTOCOL_ID = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const DEFAULT_DECIMALS = 18;
export const USDC_DECIMALS = 6;
export const USDC_DENOMINATOR = BigDecimal.fromString("1000000");
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_TEN = BigInt.fromI32(10);
export let BIGINT_HUNDRED = BigInt.fromI32(100);
export let BIGINT_THOUSAND = BigInt.fromI32(1000);
export let BIGINT_MAX = BigInt.fromString(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);
export let BIGDECIMAL_ZERO = new BigDecimal(BIGINT_ZERO);
export let BIGDECIMAL_HUNDRED = new BigDecimal(BIGINT_HUNDRED);
export let MAX_UINT = BigInt.fromI32(2).times(BigInt.fromI32(255));
export let DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const SECONDS_PER_DAY = 60 * 60 * 24;
export let MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export let MS_PER_YEAR = DAYS_PER_YEAR.times(new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000)));

/////////////////
/////////////////
/////////////////

////////////

export const ETH_MAINNET_MANAGER_ADDRESS = "0xA86e412109f77c45a3BC1c5870b880492Fb86A14";

export const TOKE_ADDRESS = "0x2e9d63788249371f1DFC918a52f8d799F4a38C94";
export const TOKE_NAME = "Tokemak";
export const TOKE_SYMBOL = "TOKE";

export const ETH_MAINNET_NETWORK = "mainnet";

export const ETH_MAINNET_USDC_ORACLE_ADDRESS = "0x83d95e0d5f402511db06817aff3f9ea88224b030";
export const ETH_MAINNET_CALCULATIONS_CURVE_ADDRESS = "0x25BF7b72815476Dd515044F9650Bf79bAd0Df655";
export const ETH_MAINNET_CALCULATIONS_SUSHI_SWAP_ADDRESS = "0x8263e161A855B644f582d9C164C66aABEe53f927";

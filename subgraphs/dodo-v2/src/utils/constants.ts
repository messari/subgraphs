import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const DODOLpToken_ADDRESS = "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd";
export const vDODOToken_ADDRESS = "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a";
export const DVMFactory_ADDRESS = "0x72d220cE168C4f361dD4deE5D826a01AD8598f6C";
export const CPFactory_ADDRESS = "0xE8C9A78725D0451FA19878D5f8A3dC0D55FECF25";
export const DPPFactory_ADDRESS = "0x5336edE8F971339F6c0e304c66ba16F1296A2Fbe";
export const DSPFactory_ADDRESS = "0x6fdDB76c93299D985f4d3FC7ac468F9A168577A4";
/**
 * usd pricing
 */
export const WRAPPED_ETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export const SECONDS_PER_HOUR = 60 * 60;
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

export namespace Network {
  export const ARBITRUM = "ARBITRUM";
  export const AVALANCHE = "AVALANCHE";
  export const AURORA = "AURORA";
  export const BSC = "BSC";
  export const CELO = "CELO";
  export const CRONOS = "CRONOS";
  export const MAINNET = "MAINNET";
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

export namespace LiquidityPoolFeeType {
  export const TRADING_FEE = "TRADING_FEE";
  export const PROTOCOL_FEE = "PROTOCOL_FEE";
  export const TIERED_FEE = "PROTOCOL_FEE";
  export const DYNAMIC_FEE = "PROTOCOL_FEE";
}

export namespace RewardTokenType {
  export const DEPOSIT = "DEPOSIT";
  export const BORROW = "BORROW";
}

export const STABLE_COINS: string[] = [
  "0x6b175474e89094c44da98b954eedeac495271d0f", // dai
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // usdc
  "0xdac17f958d2ee523a2206206994597c13d831ec7" // usdt
];

export const TRUE: bool = true;

import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const DODOLpToken_ADDRESS = "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd";
export const vDODOToken_ADDRESS = "0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export const SECONDS_PER_DAY = 60 * 60 * 24; // 86400
export const MS_PER_DAY = new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000));
export const DAYS_PER_YEAR = new BigDecimal(BigInt.fromI32(365));
export const MS_PER_YEAR = DAYS_PER_YEAR.times(
  new BigDecimal(BigInt.fromI32(24 * 60 * 60 * 1000))
);

export namespace Network {
  export const ARBITRUM = "arbitrum-one";
  export const AVALANCHE = "avalanche";
  export const AURORA = "aurora";
  export const BSC = "binance-smart-chain";
  export const CELO = "celo";
  export const CRONOS = "cronos";
  export const ETHEREUM = "ethereum";
  export const FANTOM = "fantom";
  export const HARMONY = "harmony-shard-0";
  export const MOONBEAM = "moonbeam";
  export const MOONRIVER = "moonriver";
  export const OPTIMISM = "optimistic-ethereum";
  export const POLYGON = "polygon-pos";
  export const XDAI = "xdai";
}

export namespace ProtocolType {
  export const EXCHANGE = "exchange";
  export const LENDING = "lending";
  export const YIELD = "yield";
  export const BRIDGE = "bridge";
  export const GENERIC = "generic";
}

export namespace LiquidityPoolFeeType {
  export const TRADING_FEE = "trading-fee";
  export const PROTOCOL_FEE = "protocol-fee";
  export const TIERED_FEE = "tiered-fee";
  export const DYNAMIC_FEE = "dynamic-fee";
}

export namespace RewardTokenType {
  export const DEPOSIT = "deposit";
  export const BORROW = "borrow";
}

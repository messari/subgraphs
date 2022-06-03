import { Address, BigInt, ethereum, BigDecimal, log } from "@graphprotocol/graph-ts";

export let DVMFactory_ADDRESS = '0x72d220ce168c4f361dd4dee5d826a01ad8598f6c'
export let CPFactory_ADDRESS = '0xe8c9a78725d0451fa19878d5f8a3dc0d55fecf25'
export let DPPFactory_ADDRESS = '0x5336ede8f971339f6c0e304c66ba16f1296a2fbe'
export let DSPFactory_ADDRESS = '0x6fddb76c93299d985f4d3fc7ac468f9a168577a4'
export let MINE_PROXY = '0x0d9685D4037580F68D9F77B08971f17E1000bBdc'
export let DODOLpToken_ADDRESS = '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd'
export let vDODOToken_ADDRESS = '0xc4436fbae6eba5d95bf7d53ae515f8a707bd402a'
export let FEE_MODEL_INSTANCE = '0x5e84190a270333aCe5B9202a3F4ceBf11b81bB01'
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0xdac17f958d2ee523a2206206994597c13d831ec7'
];

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


export const TRUE: bool = true;

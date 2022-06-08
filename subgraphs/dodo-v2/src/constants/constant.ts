import { Address, BigInt, ethereum, BigDecimal, log } from "@graphprotocol/graph-ts";

export let DVMFactory_ADDRESS = '0x790b4a80fb1094589a3c0efc8740aa9b0c1733fb'
export let CPFactory_ADDRESS = '0x778df5b12170e8af8df94356bfc864e57ce185dc'
export let DPPFactory_ADDRESS = '0x9b64c81ba54ea51e1f6b7fefb3cff8aa6f1e2a09'
export let DSPFactory_ADDRESS = '0x0fb9815938ad069bf90e14fe6c596c514bede767'
export let MINE_PROXY = '0xe5e9b0Cab984b58b7e7AE17707d633295d5a4C4d'
export let DODOLpToken_ADDRESS = '0x67ee3Cb086F8a16f34beE3ca72FAD36F7Db929e2'
export let vDODOToken_ADDRESS = '0x4D6A41C682874E5dd1BBD58184eE8FF145C89202'
export let FEE_MODEL_INSTANCE = '0x5e84190a270333aCe5B9202a3F4ceBf11b81bB01'
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const STABLE_COINS: string[] = [
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  '0x55d398326f99059ff775485246999027b3197955'
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

import { Address, BigInt, ethereum, BigDecimal, log } from "@graphprotocol/graph-ts";

export let DVMFactory_ADDRESS = '0x79887f65f83bdf15Bcc8736b5e5BcDB48fb8fE13'
export let CPFactory_ADDRESS = '0x42ddEc68db70F5992eB7AB22dfaD8A57109841C9'
export let DPPFactory_ADDRESS = '0xd24153244066F0afA9415563bFC7Ba248bfB7a51'
export let DSPFactory_ADDRESS = '0x43C49f8DD240e1545F147211Ec9f917376Ac1e87'
export let MINE_PROXY = '0x47a65e74dd6b6B5E3243dBb01EDEd9D55ba234Ad'
export let DODOLpToken_ADDRESS = '0xe4bf2864ebec7b7fdf6eeca9bacae7cdfdaffe78'
export let vDODOToken_ADDRESS = '0x0000000000000000000000000000000000000000'
export let FEE_MODEL_INSTANCE = '0x67Df06D0a3c9ab146358C9CE97403C6b00B234d6'
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

export const STABLE_COINS: string[] = [
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
  '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
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

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

export const WETH_VAULT = "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36";
export const CURRENT_VAULTS = [
  "0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36",
  "0x04bDA0CF6Ad025948Af830E75228ED420b0e860d",
  "0xa760e26aA76747020171fCF8BdA108dFdE8Eb930",
  "0x1b429e75369ea5cd84421c1cc182cee5f3192fd3",
  "0x8858A739eA1dd3D80FE577EF4e0D03E88561FaA3",
  "0xD3B5D9a561c293Fb42b446FE7e237DaA9BF9AA84",
  "0xe7a7D17e2177f66D035d9D50A7f48d8D8E31532D",
  "0x15A629f0665A3Eb97D7aE9A7ce7ABF73AeB79415",
  "0xf49764c9C5d644ece6aE2d18Ffd9F1E902629777",
  "0xADF15Ec41689fc5b6DcA0db7c53c9bFE7981E655",
  "0x808D3E6b23516967ceAE4f17a5F9038383ED5311",
  "0xDc0b02849Bb8E0F126a216A2840275Da829709B0",
  "0x94671A3ceE8C7A12Ea72602978D1Bb84E920eFB2",
  "0x0CE34F4c26bA69158BC2eB8Bf513221e44FDfB75",
  "0x8d2254f3AE37201EFe9Dfd9131924FE0bDd97832",
  "0x9eEe9eE0CBD35014e12E1283d9388a40f69797A3",
  "0x482258099De8De2d0bda84215864800EA7e6B03D",
  "0x03DccCd17CC36eE61f9004BCfD7a85F58B2D360D",
  "0xeff721Eae19885e17f5B80187d6527aad3fFc8DE",
  "0x2e9F9bECF5229379825D0D3C1299759943BD4fED",
  "0x7211508D283353e77b9A7ed2f22334C219AD4b4C",
  "0x2Fc6e9c1b2C07E18632eFE51879415a580AD22E1",
  "0x41f6a95Bacf9bC43704c4A4902BA5473A8B00263",
];

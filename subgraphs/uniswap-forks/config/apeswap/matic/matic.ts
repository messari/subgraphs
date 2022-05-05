import { BigDecimal } from '@graphprotocol/graph-ts';
import { ConfigurationFields } from '../../configurations/fields';
import { FieldMap } from '../../configurations/types';


export const ApeswapMaticConfigurations: FieldMap = {
  [ConfigurationFields.NETWORK]: "matic",
  [ConfigurationFields.PROTOCOL_NAME]: "Apeswap",
  [ConfigurationFields.PROTOCOL_SLUG]: "apeswap",
  [ConfigurationFields.FACTORY_ADDRESS]: "0xCf083Be4164828f00cAE704EC15a36D711491284",
  [ConfigurationFields.TRADING_FEE]: BigDecimal.fromString("2"),
  [ConfigurationFields.PROTOCOL_FEE_TO_ON]: BigDecimal.fromString("1.5"),
  [ConfigurationFields.LP_FEE_TO_ON]: BigDecimal.fromString("0.5"),
  [ConfigurationFields.PROTOCOL_FEE_TO_OFF]: BigDecimal.fromString("0.0"),
  [ConfigurationFields.LP_FEE_TO_OFF]: BigDecimal.fromString("2"),
  [ConfigurationFields.FEE_ON_OFF]: "ON",
  [ConfigurationFields.REWARD_INTERVAL_TYPE]: "BLOCK",
  [ConfigurationFields.REFERENCE_TOKEN]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  [ConfigurationFields.REWARD_TOKENS]: "0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95",  
  [ConfigurationFields.WHITELIST_TOKENS]: [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", // BNB
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6", // WBTC
    "0x5d47bAbA0d66083C52009271faF3F50DCc01023C", // BANANA
  ],
  [ConfigurationFields.STABLE_COINS]: [
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
  ],
  [ConfigurationFields.STABLE_ORACLE_POOLS]: [
    "0xd32f3139a214034a0f9777c87ee0a064c1ff6ae2", // WMATIC/DAI
    "0x65d43b64e3b31965cd5ea367d4c2b94c03084797", // WMATIC/USDT
    "0x019011032a7ac3a87ee885b6c08467ac46ad11cd", // WMATIC/USDC
  ],
  [ConfigurationFields.UNTRACKED_PAIRS]: []
}

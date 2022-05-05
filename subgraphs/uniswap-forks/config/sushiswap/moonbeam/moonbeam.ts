import { BigDecimal } from '@graphprotocol/graph-ts';
import { ConfigurationFields } from '../../configurations/fields';
import { FieldMap } from '../../configurations/types';

export const SushiswapMoonbeamConfigurations: FieldMap = {
  [ConfigurationFields.NETWORK]: "moonbeam",
  [ConfigurationFields.PROTOCOL_NAME]: "Sushiswap",
  [ConfigurationFields.PROTOCOL_SLUG]: "sushiswap",
  [ConfigurationFields.FACTORY_ADDRESS]: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
  [ConfigurationFields.TRADING_FEE]: BigDecimal.fromString("3"),
  [ConfigurationFields.PROTOCOL_FEE_TO_ON]: BigDecimal.fromString("0.5"),
  [ConfigurationFields.LP_FEE_TO_ON]: BigDecimal.fromString("2.5"),
  [ConfigurationFields.PROTOCOL_FEE_TO_OFF]: BigDecimal.fromString("0.0"),
  [ConfigurationFields.LP_FEE_TO_OFF]: BigDecimal.fromString("3"),
  [ConfigurationFields.FEE_ON_OFF]: "ON",
  [ConfigurationFields.REWARD_INTERVAL_TYPE]: "TIMESTAMP",
  [ConfigurationFields.REFERENCE_TOKEN]: "0x30D2a9F5FDf90ACe8c17952cbb4eE48a55D916A7",
  [ConfigurationFields.REWARD_TOKENS]: "0x2C78f1b70Ccf63CDEe49F9233e9fAa99D43AA07e",  
  [ConfigurationFields.WHITELIST_TOKENS]: [
    "0xacc15dc74880c9944775448304b263d191c6077f",
    "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9",
    "0x1dc78acda13a8bc4408b207c9e48cdbc096d95e0",
    "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594",
    "0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7",
    "0xc234a67a4f840e61ade794be47de455361b52413",
    "0x085416975fe14c2a731a97ec38b9bf8135231f62",
    "0x322e86852e492a7ee17f28a78c663da38fb33bfb"
  ],
  [ConfigurationFields.STABLE_COINS]: [
    "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9", // USDC
    "0xc234A67a4F840E61adE794be47de455361b52413", // DAI
    "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594", // USDT
  ],
  [ConfigurationFields.STABLE_ORACLE_POOLS]: [
    "0x6853f323508ba1c33a09c4e956ecb9044cc1a801", // wETH/USDC
    "0x499a09c00911d373fda6c28818d95fa8ca148a60", // wETH/USDT
    "0xa8581e054e239fd7b2fa6db9298b941591f52dbe", // wETH/DAI
  ],
  [ConfigurationFields.UNTRACKED_PAIRS]: []
}
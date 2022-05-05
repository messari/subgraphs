import { BigDecimal } from '@graphprotocol/graph-ts';
import { ConfigurationFields } from '../../configurations/fields';
import { FieldMap } from '../../configurations/types';

export const SushiswapMaticConfigurations: FieldMap = {
  [ConfigurationFields.NETWORK]: "matic",
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
  [ConfigurationFields.REFERENCE_TOKEN]: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  [ConfigurationFields.REWARD_TOKENS]: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a",  
  [ConfigurationFields.WHITELIST_TOKENS]: [
    "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
    "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
    "0x104592a158490a9228070e0a8e5343b499e125d0",
    "0x2f800db0fdb5223b3c3f354886d907a671414a7f",
    "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89",
    "0x34d4ab47bee066f361fa52d792e69ac7bd05ee23",
    "0xe8377a076adabb3f9838afb77bee96eac101ffb1",
    "0x61daecab65ee2a1d5b6032df030f3faa3d116aa7",
    "0xd3f07ea86ddf7baebefd49731d7bbd207fedc53b"
  ],
  [ConfigurationFields.STABLE_COINS]: [
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
  ],
  [ConfigurationFields.STABLE_ORACLE_POOLS]: [
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // wETH/USDC
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // wETH/USDT
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", // wETH/DAI
  ],
  [ConfigurationFields.UNTRACKED_PAIRS]: []
}
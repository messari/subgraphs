import { BigDecimal } from '@graphprotocol/graph-ts';
import { ConfigurationFields } from '../../configurations/fields';
import { FieldMap } from '../../configurations/types';

export const SushiswapArbitrumConfigurations: FieldMap = {
  [ConfigurationFields.NETWORK]: "arbitrum_one",
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
  [ConfigurationFields.REFERENCE_TOKEN]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  [ConfigurationFields.REWARD_TOKENS]: "0xd4d42F0b6DEF4CE0383636770eF773390d85c61A",  
  [ConfigurationFields.WHITELIST_TOKENS]: [
    "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8"
  ],
  [ConfigurationFields.STABLE_COINS]: [
    "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI
    "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT
  ],
  [ConfigurationFields.STABLE_ORACLE_POOLS]: [
    "0x905dfcd5649217c42684f23958568e533c711aa3", // wETH/USDC
    "0xcb0e5bfa72bbb4d16ab5aa0c60601c438f04b4ad", // wETH/USDT
  ],
  [ConfigurationFields.UNTRACKED_PAIRS]: []
}

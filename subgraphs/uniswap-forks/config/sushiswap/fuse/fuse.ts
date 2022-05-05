import { BigDecimal } from '@graphprotocol/graph-ts';
import { FeeSwitch, RewardIntervalType } from '../../../src/common/constants';
import { ConfigurationFields } from '../../configurations/fields';
import { FieldMap } from '../../configurations/types';

export const SushiswapFuseConfigurations: FieldMap = {
  [ConfigurationFields.NETWORK]: "fuse",
  [ConfigurationFields.PROTOCOL_NAME]: "Sushiswap",
  [ConfigurationFields.PROTOCOL_SLUG]: "sushiswap",
  [ConfigurationFields.FACTORY_ADDRESS]: "0x43eA90e2b786728520e4f930d2A71a477BF2737C",
  [ConfigurationFields.TRADING_FEE]: BigDecimal.fromString("3"),
  [ConfigurationFields.PROTOCOL_FEE_TO_ON]: BigDecimal.fromString("0.5"),
  [ConfigurationFields.LP_FEE_TO_ON]: BigDecimal.fromString("2.5"),
  [ConfigurationFields.PROTOCOL_FEE_TO_OFF]: BigDecimal.fromString("0.0"),
  [ConfigurationFields.LP_FEE_TO_OFF]: BigDecimal.fromString("3"),
  [ConfigurationFields.FEE_ON_OFF]: FeeSwitch.ON,
  [ConfigurationFields.REWARD_INTERVAL_TYPE]: RewardIntervalType.TIMESTAMP,
  [ConfigurationFields.REFERENCE_TOKEN]: "0xa722c13135930332Eb3d749B2F0906559D2C5b99",
  [ConfigurationFields.REWARD_TOKENS]: "0x90708b20ccC1eb95a4FA7C8b18Fd2C22a0Ff9E78",  
  [ConfigurationFields.WHITELIST_TOKENS]: [
    "0x0be9e53fd7edac9f859882afdda116645287c629",
    "0xa722c13135930332eb3d749b2f0906559d2c5b99",
    "0x33284f95ccb7b948d9d352e1439561cf83d8d00d",
    "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5",
    "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba",
    "0xfadbbf8ce7d5b7041be672561bba99f79c532e10",
    "0x249be57637d8b013ad64785404b24aebae9b098b" 
  ],
  [ConfigurationFields.STABLE_COINS]: [
    "0x620fd5fa44BE6af63715Ef4E65DDFA0387aD13F5", // USDC
    "0x94Ba7A27c7A95863d1bdC7645AC2951E0cca06bA", // DAI
    "0xFaDbBF8Ce7D5b7041bE672561bbA99f79c532e10", // USDT
  ],
  [ConfigurationFields.STABLE_ORACLE_POOLS]: [
    "0xba9ca720e314f42e17e80991c1d0affe47387108", // wETH/USDC
    "0xadf3924f44d0ae0242333cde32d75309b30a0fcc", // wETH/USDT
    "0x44f5b873d6b2a2ee8309927e22f3359c7f23d428", // wETH/DAI
  ],
  [ConfigurationFields.UNTRACKED_PAIRS]: []
}
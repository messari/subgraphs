import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { ConfigurationFields } from "./fields";
import { FieldMap } from "./types";

class IConfig {
    NETWORK: string;
  
    PROTOCOL_NAME: string;
    PROTOCOL_SLUG: string;
  
    FACTORY_ADDRESS: string
    FACTORY_CONTRACT: Factory
  
    TRADING_FEE: BigDecimal;
    PROTOCOL_FEE_TO_ON: BigDecimal;
    LP_FEE_TO_ON: BigDecimal;
    PROTOCOL_FEE_TO_OFF: BigDecimal;
    LP_FEE_TO_OFF: BigDecimal;
    FEE_ON_OFF: string;
  
    REWARD_INTERVAL_TYPE: string;
  
    NATIVE_TOKEN: string;
    REWARD_TOKENS: string;
    WHITELIST_TOKENS: string[];
    STABLE_COINS: string[];
    STABLE_ORACLE_POOLS: string[];
    UNTRACKED_PAIRS: string[];
  
    constructor(configurations: FieldMap) {
  
      this.NETWORK = configurations[ConfigurationFields.NETWORK];
  
      this.PROTOCOL_NAME = configurations[ConfigurationFields.PROTOCOL_NAME];
      this.PROTOCOL_SLUG = configurations[ConfigurationFields.PROTOCOL_SLUG];
      this.FACTORY_ADDRESS = configurations[ConfigurationFields.FACTORY_ADDRESS];
      this.FACTORY_CONTRACT = configurations[ConfigurationFields.FACTORY_CONTRACT];
  
      this.TRADING_FEE = configurations[ConfigurationFields.TRADING_FEE];
      this.PROTOCOL_FEE_TO_ON = configurations[ConfigurationFields.PROTOCOL_FEE_TO_ON];
      this.LP_FEE_TO_ON = configurations[ConfigurationFields.LP_FEE_TO_ON];
      this.PROTOCOL_FEE_TO_OFF = configurations[ConfigurationFields.PROTOCOL_FEE_TO_OFF];
      this.LP_FEE_TO_OFF = configurations[ConfigurationFields.LP_FEE_TO_OFF];
      this.FEE_ON_OFF = configurations[ConfigurationFields.FEE_ON_OFF];
  
      this.REWARD_INTERVAL_TYPE = configurations[ConfigurationFields.REWARD_INTERVAL_TYPE];
      this.NATIVE_TOKEN = configurations[ConfigurationFields.REFERENCE_TOKEN];
      this.REWARD_TOKENS = configurations[ConfigurationFields.REWARD_TOKENS];
      this.WHITELIST_TOKENS = configurations[ConfigurationFields.WHITELIST_TOKENS];
      this.STABLE_COINS = configurations[ConfigurationFields.STABLE_COINS];
      this.STABLE_ORACLE_POOLS = configurations[ConfigurationFields.STABLE_ORACLE_POOLS];
      this.UNTRACKED_PAIRS = configurations[ConfigurationFields.UNTRACKED_PAIRS];
    } 
  
    getNetwork() {
      return this.NETWORK;
    }
    getProtocolName() {
      return this.PROTOCOL_NAME;
    }
    getProtocolSlug() {
      return this.PROTOCOL_SLUG;
    }
    getFactoryAddress() {
      return this.FACTORY_ADDRESS;
    }
    getFactoryContract() { 
      return this.FACTORY_CONTRACT;
    }
    getTradeFee() {
      return this.TRADING_FEE;
    }
    getProtocolFeeToOn() {
      return this.PROTOCOL_FEE_TO_ON;
    }
    getLPFeeToOn() {
      return this.LP_FEE_TO_ON;
    }
    getProtocolFeeToOff() {
      return this.PROTOCOL_FEE_TO_OFF;
    }
    getLPFeeToOff() {
      return this.LP_FEE_TO_OFF;
    }
    getFeeOnOff() {
      return this.FEE_ON_OFF;
    }
    getNativeToken() {
      return this.NATIVE_TOKEN;
    }
    getRewardTokens() {
      return this.REWARD_TOKENS;
    }
    getWhitelistTokens() {
      return this.WHITELIST_TOKENS;
    }
    getStableCoins() {
      return this.STABLE_COINS;
    }
    getStableOraclePools() {
      return this.STABLE_ORACLE_POOLS;
    }
  }
  
export class Configurations extends IConfig {
    constructor(configurations: FieldMap) {
      log.warning("Generated configurations for ${Protocol}/${Network}", []);
      super(configurations);
    }
}
import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { ConfigurationFields } from "./fields";
import { FieldMap } from "./types";

class IConfig {
    network: string;
  
    protocolName: string;
    protocolSlug: string;
  
    factoryAddress: string
    factoryContract: Factory
  
    tradingFee: BigDecimal;
    protocolFeeToOn: BigDecimal;
    lpFeeToOn: BigDecimal;
    protocolFeeToOff: BigDecimal;
    lpFeeToOff: BigDecimal;
    feeOnOff: string;
  
    rewardIntervalType: string;
  
    referenceToken: string;
    rewardToken: string;
    whitelistTokens: string[];
    stableCoins: string[];
    stableOraclePools: string[];
    untrackedPairs: string[];
  
    constructor(configurations: FieldMap) {
  
      this.network = configurations[ConfigurationFields.NETWORK];
  
      this.protocolName = configurations[ConfigurationFields.PROTOCOL_NAME];
      this.protocolSlug = configurations[ConfigurationFields.PROTOCOL_SLUG];
      this.factoryAddress = configurations[ConfigurationFields.FACTORY_ADDRESS];
      this.factoryContract = configurations[ConfigurationFields.FACTORY_CONTRACT];
  
      this.tradingFee = configurations[ConfigurationFields.TRADING_FEE];
      this.protocolFeeToOn = configurations[ConfigurationFields.PROTOCOL_FEE_TO_ON];
      this.lpFeeToOn = configurations[ConfigurationFields.LP_FEE_TO_ON];
      this.protocolFeeToOff = configurations[ConfigurationFields.PROTOCOL_FEE_TO_OFF];
      this.lpFeeToOff = configurations[ConfigurationFields.LP_FEE_TO_OFF];
      this.feeOnOff = configurations[ConfigurationFields.FEE_ON_OFF];
  
      this.rewardIntervalType = configurations[ConfigurationFields.REWARD_INTERVAL_TYPE];
      this.referenceToken = configurations[ConfigurationFields.REFERENCE_TOKEN];
      this.rewardToken = configurations[ConfigurationFields.REWARD_TOKENS];
      this.whitelistTokens = configurations[ConfigurationFields.WHITELIST_TOKENS];
      this.stableCoins = configurations[ConfigurationFields.STABLE_COINS];
      this.stableOraclePools = configurations[ConfigurationFields.STABLE_ORACLE_POOLS];
      this.untrackedPairs = configurations[ConfigurationFields.UNTRACKED_PAIRS];
    } 
  
    getNetwork() {
      return this.network;
    }
    getProtocolName() {
      return this.protocolName;
    }
    getProtocolSlug() {
      return this.protocolSlug;
    }
    getFactoryAddress() {
      return this.factoryAddress;
    }
    getFactoryContract() { 
      return this.factoryContract;
    }
    getTradeFee() {
      return this.tradingFee;
    }
    getProtocolFeeToOn() {
      return this.protocolFeeToOn;
    }
    getLPFeeToOn() {
      return this.lpFeeToOn;
    }
    getProtocolFeeToOff() {
      return this.protocolFeeToOff;
    }
    getLPFeeToOff() {
      return this.lpFeeToOff;
    }
    getFeeOnOff() {
      return this.feeOnOff;
    }
    getNativeToken() {
      return this.referenceToken;
    }
    getRewardTokens() {
      return this.rewardToken;
    }
    getWhitelistTokens() {
      return this.whitelistTokens;
    }
    getStableCoins() {
      return this.stableCoins;
    }
    getStableOraclePools() {
      return this.stableOraclePools;
    }
    getUntrackedPairs() {
      return this.untrackedPairs;
    }
  }
  
export class Configurations extends IConfig {
    constructor(configurations: FieldMap) {
      log.warning("Generated configurations for ${Protocol}/${Network}", []);
      super(configurations);
    }
}
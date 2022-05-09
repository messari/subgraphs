import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { ConfigurationFields } from "./fields";

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
  
    constructor(configurations: ConfigurationFields) {
  
      this.network = configurations.network;
  
      this.protocolName = configurations.protocolName;
      this.protocolSlug = configurations.protocolSlug;
      this.factoryAddress = configurations.factoryAddress;
      this.factoryContract = Factory.bind(Address.fromString(this.factoryAddress));
  
      this.tradingFee = configurations.tradingFee;
      this.protocolFeeToOn = configurations.protocolFeeToOn;
      this.lpFeeToOn = configurations.lpFeeToOn;
      this.protocolFeeToOff = configurations.protocolFeeToOff;
      this.lpFeeToOff = configurations.lpFeeToOff;
      this.feeOnOff = configurations.feeOnOff;
  
      this.rewardIntervalType = configurations.rewardIntervalType;
      this.referenceToken = configurations.referenceToken;
      this.rewardToken = configurations.rewardToken;
      this.whitelistTokens = configurations.whitelistTokens;
      this.stableCoins = configurations.stableCoins;
      this.stableOraclePools = configurations.stableOraclePools;
      this.untrackedPairs = configurations.untrackedPairs;
    } 
  
    getNetwork(): string{
      return this.network;
    }
    getProtocolName(): string {
      return this.protocolName;
    }
    getProtocolSlug(): string {
      return this.protocolSlug;
    }
    getFactoryAddress(): string {
      return this.factoryAddress;
    }
    getFactoryContract(): Factory { 
      return this.factoryContract;
    }
    getTradeFee(): BigDecimal {
      return this.tradingFee;
    }
    getProtocolFeeToOn(): BigDecimal {
      return this.protocolFeeToOn;
    }
    getLPFeeToOn(): BigDecimal {
      return this.lpFeeToOn;
    }
    getProtocolFeeToOff(): BigDecimal {
      return this.protocolFeeToOff;
    }
    getLPFeeToOff(): BigDecimal {
      return this.lpFeeToOff;
    }
    getFeeOnOff(): string {
      return this.feeOnOff;
    }
    getRewardIntervalType(): string {
      return this.rewardIntervalType;
    }
    getReferenceToken(): string {
      return this.referenceToken;
    }
    getRewardToken(): string {
      return this.rewardToken;
    }
    getWhitelistTokens(): string[] {
      return this.whitelistTokens;
    }
    getStableCoins(): string[] {
      return this.stableCoins;
    }
    getStableOraclePools(): string[] {
      return this.stableOraclePools;
    }
    getUntrackedPairs(): string[] {
      return this.untrackedPairs;
    }
  }
  
export class Configurations extends IConfig {
    constructor(configurations: ConfigurationFields) {
      log.warning("Generated configurations for ${Protocol}/${Network}", []);
      super(configurations);
    }
}
import { BigDecimal } from "@graphprotocol/graph-ts";

export interface ConfigurationFields {
    network: string,
  
    protocolName: string,
    protocolSlug: string,
  
    factoryAddress: string,
  
    tradingFee: BigDecimal,
    protocolFeeToOn: BigDecimal,
    lpFeeToOn: BigDecimal,
    protocolFeeToOff: BigDecimal,
    lpFeeToOff: BigDecimal,
    feeOnOff: string,
  
    rewardIntervalType: string,
  
    referenceToken: string,
    rewardToken: string,
    whitelistTokens: string[],
    stableCoins: string[],
    stableOraclePools: string[],
    untrackedPairs: string[],
  }
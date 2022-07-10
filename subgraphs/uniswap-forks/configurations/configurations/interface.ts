import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";

// This interface is to be used by the configurations classes for each protocol/network deployment.
// If a new configuration is needed for a deployment, add a new value to the configurations interface.
export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getSchemaVersion(): string;
  getSubgraphVersion(): string;
  getMethodologyVersion(): string;
  getFactoryAddress(): string;
  getFactoryContract(): Factory;
  getTradeFee(): BigDecimal;
  getProtocolFeeToOn(): BigDecimal;
  getLPFeeToOn(): BigDecimal;
  getProtocolFeeToOff(): BigDecimal;
  getLPFeeToOff(): BigDecimal;
  getFeeOnOff(): string;
  getRewardIntervalType(): string;
  getRewardTokenRate(): BigInt;
  getReferenceToken(): string;
  getRewardToken(): string;
  getWhitelistTokens(): string[];
  getStableCoins(): string[];
  getStableOraclePools(): string[];
  getUntrackedPairs(): string[];
  getUntrackedTokens(): string[];
  getMinimumLiquidityThreshold(): BigDecimal;
}

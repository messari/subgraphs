import { BigDecimal } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getSchemaVersion(): string;
  getSubgraphVersion(): string;
  getMethodologyVersion(): string;
  getFactoryAddress(): string;
  getFactoryContract(): Factory;
  getFeeOnOff(): string;
  getRewardIntervalType(): string;
  getReferenceToken(): string
  getRewardToken(): string;
  getWhitelistTokens(): string[];
  getStableCoins(): string[];
  getStableOraclePools(): string[];
  getUntrackedPairs(): string[];
  getUntrackedTokens(): string[];
  getMinimumLiquidityThreshold(): BigDecimal;
}

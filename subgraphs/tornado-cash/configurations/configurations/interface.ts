import { BigInt, TypedMap } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getSchemaVersion(): string;
  getSubgraphVersion(): string;
  getMethodologyVersion(): string;
  getFactoryAddress(): string;
  getRewardIntervalType(): string;
  getNativeToken(): TypedMap<string, string>;
  getRewardToken(): TypedMap<string, string>;
  getPoolDenomination(isNativeTokenPool: boolean, poolAddr: string): BigInt;
}

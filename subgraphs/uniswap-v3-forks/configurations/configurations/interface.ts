import { Factory } from "../../generated/templates/Pool/Factory";
import { Bytes, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): Bytes;
  getFactoryContract(): Factory;
  getProtocolFeeOnOff(): string;
  getInitialProtocolFeeProportion(fee: i64): BigDecimal;
  getProtocolFeeProportion(protocolFee: BigInt): BigDecimal;
  getRewardIntervalType(): string;
  getReferenceToken(): Bytes;
  getRewardToken(): Bytes;
  getWhitelistTokens(): Bytes[];
  getStableCoins(): Bytes[];
  getStableOraclePools(): Bytes[];
  getUntrackedPairs(): Bytes[];
  getUntrackedTokens(): Bytes[];
  getMinimumLiquidityThreshold(): BigDecimal;
}

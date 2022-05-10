import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
import { Factory } from "../../generated/Factory/Factory";
import { BIGDECIMAL_ZERO } from "../../src/common/constants";
export interface Configurations {
  getNetwork(): string;
  getProtocolName(): string;
  getProtocolSlug(): string;
  getFactoryAddress(): string;
  getFactoryContract(): Factory;
  getTradeFee(): BigDecimal;
  getProtocolFeeToOn(): BigDecimal;
  getLPFeeToOn(): BigDecimal;
  getProtocolFeeToOff(): BigDecimal;
  getLPFeeToOff(): BigDecimal;
  getFeeOnOff(): string;
  getRewardIntervalType(): string;
  getReferenceToken(): string
  getRewardToken(): string;
  getWhitelistTokens(): string[];
  getStableCoins(): string[];
  getStableOraclePools(): string[];
  getUntrackedPairs(): string[];
}
import { Address, BigDecimal, log } from '@graphprotocol/graph-ts';
import { Factory } from '../../../../../generated/Factory/Factory';
import { FeeSwitch, MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND, Network, PROTOCOL_SCHEMA_VERSION, RewardIntervalType } from '../../../../../src/common/constants';
import { Configurations } from '../../../../../configurations/configurations/interface';
import { PROTOCOL_SUBGRAPH_VERSION, PROTOCOL_METHODOLOGY_VERSION, PROTOCOL_NAME, PROTOCOL_SLUG } from '../../../src/common/constants';

export class HoneyswapXdaiConfigurations implements Configurations {
  getNetwork(): string {
    return Network.XDAI;
  }
  getSchemaVersion(): string {
    return PROTOCOL_SCHEMA_VERSION;
  }
  getSubgraphVersion(): string {
    return PROTOCOL_SUBGRAPH_VERSION;
  }
  getMethodologyVersion(): string {
    return PROTOCOL_METHODOLOGY_VERSION;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7";
  }
  getFactoryContract(): Factory { 
    return Factory.bind(Address.fromString("0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7"));
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("3");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.5");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("2.5");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("3.0");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.TIMESTAMP;
  }
  getReferenceToken(): string {
    return "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"; // WETH
  }
  getRewardToken(): string {
    return "0x38fb649ad3d6ba1113be5f57b927053e97fc5bf7"; // xCOMB
  }
  getWhitelistTokens(): string[] {
    return [];
  }
  getStableCoins(): string[] {
    return [];
  }
  getStableOraclePools(): string[] {
    return [];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
}

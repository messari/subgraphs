import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_ONE_THOUSAND,
  Network,
  PROTOCOL_SCHEMA_VERSION,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../src/common/constants";

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
    return Factory.bind(
      Address.fromString("0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7")
    );
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
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0x9c58bacc331c9aa871afd802db6379a98e80cedb"; // GNO
  }
  getRewardToken(): string {
    return "0x38fb649ad3d6ba1113be5f57b927053e97fc5bf7"; // xCOMB
  }
  getWhitelistTokens(): string[] {
    return [
      "0x9c58bacc331c9aa871afd802db6379a98e80cedb", // GNO
      "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1", // WETH
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
      "0x38fb649ad3d6ba1113be5f57b927053e97fc5bf7", // xCOMB
      "0x71850b7e9ee3f13ab46d67167341e4bdc905eef9", // HNY
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // WXDAI
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // USDC
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x321704900d52f44180068caa73778d5cd60695a6", // GNO-WXDAI
      // "0x9e8e5e4a0900fe4634c02aaf0f130cfb93c53fbc", // xCOMB-WXDAI
      // "0x7bea4af5d425f2d4485bdad1859c88617df31a67", // WETH-WXDAI
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
}

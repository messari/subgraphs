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

export class HoneyswapMaticConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
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
    return "0x03DAa61d8007443a6584e3d8f85105096543C19c";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x03DAa61d8007443a6584e3d8f85105096543C19c")
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
    return "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619"; // WETH
  }
  getRewardToken(): string {
    return "0x37d1ebc3af809b8fadb45dce7077efc629b2b5bb"; //pCOMB
  }
  getWhitelistTokens(): string[] {
    return [
      "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", // WETH
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xd862db749534d539713b2c392421fe5a8e43e19e", //USDC-WETH
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

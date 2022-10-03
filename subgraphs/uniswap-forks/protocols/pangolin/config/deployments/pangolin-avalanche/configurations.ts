import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
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

export class PangolinAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
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
    return "0xefa94DE7a4656D787667C749f7E1223D71E9FD88";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xefa94DE7a4656D787667C749f7E1223D71E9FD88")
    );
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"; // wAVAX
  }
  getRewardToken(): string {
    return "0x60781c2586d68229fde47564546784ab3faca982";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wAVAX
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xde3a24028580884448a5397872046a019649b084", // USDT old
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // USDC.e
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xde3a24028580884448a5397872046a019649b084", // USDT old
    ];
  }
  getStableOraclePools(): string[] { // TODO - Need to change these values as they currently incorrect!
    return [
      "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", // USDC/wETH created 10008355
      "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", // DAI/wETH created block 10042267
      "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", // USDT/wETH created block 10093341
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

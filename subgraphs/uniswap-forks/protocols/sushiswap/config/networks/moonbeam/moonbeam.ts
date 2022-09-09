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

export class SushiswapMoonbeamConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONBEAM;
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
    return "0xc35dadb65012ec5796536bd9864ed8773abc74c4";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xc35DADB65012eC5796536bD9864eD8773aBc74C4")
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
    return RewardIntervalType.TIMESTAMP;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7";
  }
  getRewardToken(): string {
    return "0x2c78f1b70ccf63cdee49f9233e9faa99d43aa07e";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xacc15dc74880c9944775448304b263d191c6077f", // wglmr
      "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9", // usdc
      "0x1dc78acda13a8bc4408b207c9e48cdbc096d95e0", // wbtc
      "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594", // usdt
      "0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7", // weth
      "0xc234a67a4f840e61ade794be47de455361b52413", // dai
      "0x322e86852e492a7ee17f28a78c663da38fb33bfb", /// frax
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9", // usdc
      "0xc234a67a4f840e61ade794be47de455361b52413", // dai
      "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594", // usdt
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x6853f323508ba1c33a09c4e956ecb9044cc1a801", // weth/usdc
      "0x499a09c00911d373fda6c28818d95fa8ca148a60", // weth/usdt
      "0xa8581e054e239fd7b2fa6db9298b941591f52dbe", // weth/dai
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

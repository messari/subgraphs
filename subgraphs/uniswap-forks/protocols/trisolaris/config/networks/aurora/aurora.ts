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

export class TrisolarisAuroraConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AURORA;
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
    return "0xc66f594268041db60507f00703b152492fb176e7";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xc66f594268041db60507f00703b152492fb176e7")
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
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d"; // wNEAR
  }
  getRewardToken(): string {
    return "0xfa94348467f64d5a457f75f8bc40495d33c65abb"; // Trisolaris
  }
  getWhitelistTokens(): string[] {
    return [
      "0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d", // wnear
      "0xb12bfca5a55806aaf64e99521918a4bf0fc40802", // usdc
      "0x4988a896b1227218e4a686fde5eabdcabd91571f", // usdt
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xb12bfca5a55806aaf64e99521918a4bf0fc40802", // usdc
      "0x4988a896b1227218e4a686fde5eabdcabd91571f", // usdt
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x20f8aefb5697b77e0bb835a8518be70775cda1b0", // usdc/wnear
      "0x03b666f3488a7992b2385b12df7f35156d7b29cd", // usdt/wnear
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

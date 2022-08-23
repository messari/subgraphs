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

export class VSSFinanceCronosConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CRONOS;
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
    return "0x3b44b2a187a7b3824131f8db5a74194d0a42fc15";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x3b44b2a187a7b3824131f8db5a74194d0a42fc15")
    );
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.1");
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.2");
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
    return "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23";
  }
  getRewardToken(): string {
    return "0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23", // WCRO
      "0xf2001b145b43032aaf5ee2884e456ccd805f677d", // DAI
      "0xc21223249ca28397b4b6541dffaecc539bff0c59", // USDC
      "0x66e428c3f67a68878562e79a0234c1f83c208770", // USDT
      "0xe44fd7fcb2b1581822d0c862b68222998a0c299a", // wETH
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xf2001b145b43032aaf5ee2884e456ccd805f677d", // DAI
      "0xc21223249ca28397b4b6541dffaecc539bff0c59", // USDC
      "0x66e428c3f67a68878562e79a0234c1f83c208770", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xe61Db569E231B3f5530168Aa2C9D50246525b6d6", // USDC/wCRO
      "0x3Eb9FF92e19b73235A393000C176c8bb150F1B20", // DAI/wCRO
      "0x3d2180DB9E1B909f35C398BC39EF36108C0FC8c3", // USDT/wCRO
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

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

export class MMFinanceCronosConfigurations implements Configurations {
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
    return "0xd590cc180601aecd6eeadd9b7f2b7611519544f4";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xd590cc180601aecd6eeadd9b7f2b7611519544f4")
    );
  }
  getTradeFee(): BigDecimal {
    return BigDecimal.fromString("0.17");
  }
  getProtocolFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.068"); // in their docs it's 0.07, but looking at the code is really 0.068
  }
  getLPFeeToOn(): BigDecimal {
    return BigDecimal.fromString("0.102");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.17");
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
    return "0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23"; // WCRO
  }
  getRewardToken(): string {
    return "0x97749c9b61f878a880dfe312d2594ae07aed7656"; // MMFToken
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
      "0xa68466208f1a3eb21650320d2520ee8eba5ba623", // USDC/wCRO in MMFinance
      "0xeb28c926a7afc75fcc8d6671acd4c4a298b38419", // USDT/wCRO in MMFinance
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_THOUSAND;
  }
}

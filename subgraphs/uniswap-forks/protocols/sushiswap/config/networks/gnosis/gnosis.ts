import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
  MINIMUM_LIQUIDITY_THREE_THOUSAND,
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

export class SushiswapXdaiConfigurations implements Configurations {
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
    return "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d"; // wxDAI
  }
  getRewardToken(): string {
    return "0x2995d1317dcd4f0ab89f4ae60f3f020a4f17c7ce";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1", // weth
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // wxdai
      "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252", // wbtc
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // usdc
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6", // usdt
      "0x44fa8e6f47987339850636f88629646662444217", // dai
      "0xfe7ed09c4956f7cdb54ec4ffcb9818db2d7025b8", // usdp
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xddafbb505ad214d7b80b1f830fccc89b60fb7a83", // usdc
      "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d", // dai
      "0x4ecaba5870353805a9f068101a40e0f32ed605c6", // usdt
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xa227c72a4055a9dc949cae24f54535fe890d3663", // weth/usdc
      "0x6685c047eab042297e659bfaa7423e94b4a14b9e", // weth/usdt
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
    return MINIMUM_LIQUIDITY_THREE_THOUSAND;
  }
}

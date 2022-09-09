import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND,
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

export class SushiswapFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
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
    return "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
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
    return "0x74b23882a30290451a17c44f4f05243b6b58c76d";
  }
  getRewardToken(): string {
    return "0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // wftm
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // fusd
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // dai
      "0x74b23882a30290451a17c44f4f05243b6b58c76d", // weth
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // usdc
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // usdc
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // dai
      "0x049d68029688eabf473097a2fc38ef61633a3c7a", // usdt
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // fusd
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xa48869049e36f8bfe0cc5cf655632626988c0140", // weth/usdc
      "0xd019dd7c760c6431797d6ed170bffb8faee11f99", // weth/usdt
      "0xd32f2eb49e91aa160946f3538564118388d6246a", // weth/dai
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [
      "0x0751f7661f4b5a012cae6afe38e594a6f10d4313", // taakin
      "0xf6129f6705b826dbafaa26e03aad9dd20b9235c6", // icecream
      "0xc61b68d68ba5118afd9048728b4977ebe57130a0", // sunday icecream
      "0x07a5b3d0cb418d07d9ad12cbdb30b5c5c6778531", // defi system for reference
      "0xe297e06761a5489380538a0308b6f9b4a53bea45", // fwti oil
      "0xdaa10abbc76151893cda500580cd78cc0b807c47", // fast moon
      "0x0ebdd4cdc95ec1e20d7fddc8aaedba0c840e4975", // bull moon
      "0x6160240896d8039b2d901cd59dea95396c94a1c2", // adult entertainment token
    ];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

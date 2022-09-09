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

export class SushiswapArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
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
    return "0x82af49447d8a07e3bd95bd0d56f35241523fbab1";
  }
  getRewardToken(): string {
    return "0xd4d42f0b6def4ce0383636770ef773390d85c61a";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // weth
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // wbtc
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // dai
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // usdt
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // usdc
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // usdc
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // dai
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // usdt
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x905dfcd5649217c42684f23958568e533c711aa3", // wETH/USDC
      "0xcb0e5bfa72bbb4d16ab5aa0c60601c438f04b4ad", // wETH/USDT
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

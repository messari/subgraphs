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

export class BiswapBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
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
    return "0x858e3312ed3a876947ea49d572a7c42de08af7ee";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x858e3312ed3a876947ea49d572a7c42de08af7ee")
    );
  }
  getTradeFee(blockNumber: BigInt): BigDecimal {
    if (blockNumber < BigInt.fromI32(20488163)) {
      return BigDecimal.fromString("0.1");
    }
    return BigDecimal.fromString("0.2");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    if (blockNumber < BigInt.fromI32(20488163)) {
      return BigDecimal.fromString("0.05");
    }
    return BigDecimal.fromString("0.15");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
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
    return "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  }
  getRewardToken(): string {
    return "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
      "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI
      "0x4bd17003473389a42daf6a0a729f6fdb328bbbd7", // VAI
      "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
      "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // WETH
      "0x250632378e573c6be1ac2f97fcdf00515d0aa91b", // BETH
      "0x965F527D9159dCe6288a2219DB51fc6Eef120dD1", // BSW
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC
      "0x55d398326f99059ff775485246999027b3197955", // USDT
      "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x06cd679121ec37b0a2fd673d4976b09d81791856", // USDC/WBNB
      "0x8840c6252e2e86e545defb6da98b2a0e26d8c1ba", // USDT/WBNB
      "0xacaac9311b0096e04dfe96b6d87dec867d3883dc", // BUSD/WBNB
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
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

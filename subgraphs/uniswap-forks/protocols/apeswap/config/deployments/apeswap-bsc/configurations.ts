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

export class ApeswapBscConfigurations implements Configurations {
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
    return "0x0841bd0b734e4f5853f0dd8d7ea041c241fb0da6";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x0841bd0b734e4f5853f0dd8d7ea041c241fb0da6")
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.2");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.15");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.2");
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
      "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95", // BANANA
      "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299", // GNANA
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // FEI
      "0x4dd28568d05f09b02220b09c2cb307bfd837cb95",
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x51e6d27fa57373d8d4c256231241053a70cb1d93", // BUSD/WBNB created block 4857769
      "0xf3010261b58b2874639ca2e860e9005e3be5de0b", // DAI/WBNB created block 481116
      "0x20bcc3b8a0091ddac2d0bc30f68e6cbb97de59cd", // USDT/WBNB created block 648115
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [
      "0x87bade473ea0513d4aa7085484aeaa6cb6ebe7e3", // Mor Stablecoin
      "0x7e7d3556310830581815b1aa1bbbc9e5d7097580", // NFTGirl
    ];
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

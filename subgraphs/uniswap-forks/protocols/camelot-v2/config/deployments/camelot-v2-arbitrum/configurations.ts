import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND,
  Network,
  PROTOCOL_SCHEMA_VERSION,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import {
  FACTORY_ADDRESS,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_SUBGRAPH_VERSION,
} from "../../../src/common/constants";

export class CamelotV2Configurations implements Configurations {
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
    return FACTORY_ADDRESS;
  }
  getFactoryContract(): Factory {
    return Factory.bind(Address.fromString(FACTORY_ADDRESS));
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BIGDECIMAL_ZERO;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BIGDECIMAL_ZERO;
  }
  getProtocolFeeToOff(): BigDecimal {
    return BIGDECIMAL_ZERO;
  }
  getLPFeeToOff(): BigDecimal {
    return BIGDECIMAL_ZERO;
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
    return "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"; //WETH
  }
  getRewardToken(): string {
    return "0x3d9907f9a368ad0a51be60f7da3b97cf940982d8"; // GRAIL
  }
  getWhitelistTokens(): string[] {
    return [
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // wETH
      "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", // wBTC
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC
      "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", // DAI
      "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x84652bb2539513baf36e225c930fdd8eaa63ce27", // USDC/wETH created 35081625
      "0x97b192198d164c2a1834295e302b713bc32c8f1d", // USDT/wETH created block 40441957
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
    return MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND;
  }
}

import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  FeeSwitch,
  Network,
  PROTOCOL_SCHEMA_VERSION,
  RewardIntervalType,
} from "../../../../../src/common/constants";
import {
  FACTORY_ADDRESS,
  MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND,
  MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND,
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
    return [
      "0x416139a3e5d14eb629bafa18df8cb720f7ddebe6",
      "0xc571b3d3594bde4ad30ddb5796ec0a9e56c9dc03",
      "0x326e375a6d4497a1efd3a361b43da3ad3b39fb50",
      "0x59025b7e71859120fd37e0ce08260396fd4afac9",
      "0xcc2e33e40679ed102abeaf46f2b6e67719ef4bac",
      "0x10261330cfd4696d68aa0f90a19a08ebe38b98e6",
      "0x60229b23300fee108b3b2e1a8133a31f06fde45f",
      "0x7e22502fcd4c41a4256ffc7dd65926faf46f944a",
      "0x8aecca82ecf034c0fd067e404550bb1ad14c018c",
      "0xd146d13c337323ef3ac10eb3a71820b6a284ae54",
      "0x1bd5ec354e8311b14e23985985e90c328e4b04a9",
      "0x15066da4f82b9c9bf7b8dba988790f9b554f74a7",
      "0xd84ccf9be57f35875634e3094d285b447820d482",
      "0xf406aa89c5d2fea5ea87f45126484aa7077f5c1d",
      "0xc1b228c22ca914069c7164e5489e8d79a9cbb922",
      "0xf6fd13f0bd2fae5f8c6b339de94c5c5604702ac5",
      "0x354a2eb349d9f68846124aa9a9ed4fce2d203805",
      "0x5f32a001e5213d8e4b3a0630cad3f3c5a9c7c573",
      "0x9ab215e3a9602a3ab2ef9d9c1821d34075c3b341",
      "0x3bc2f935dc9e544035a542faea44e30059c0b841",
      "0x6852024a3051de1513129ced4ddb74b3454bef30",
      "0x6d680aef579e290c92f776ed956a5cdacc26082e",
      "0xe50341e6f27a2514908f347e743119f3dfd84ad5",
      "0xb9af948698d8da0f3fe0b2f39eb1dfa0ccfa364d",
      "0x9633a8689cc4115c415f31be29cad9fdde9d4e70",
      "0x0d50b75aa41941ae6f03d9d333affeab4c281f31",
      "0x06e0ef340f2e23e0c63bbdbdc73d17c811294d9f",
      "0x29665cb36af3b93a376f4d529ef4a1ef5e6baac7",
      "0xe4387484a8026fe3b4ed2ba4e224b73f0c6c6e2a",
      "0xe0ef16ebd06d42a86c6cf7069225780d013ec6ac",
      "0xf5211b5cc0c7619e685e62d2e0d755344f914cd0",
      "0x015908fec4ac33782d7bcd7a6ae88ab0ade405f4",
      "0x7578aa78d5c5f622800d9205e942b12d353432b7",
      "0x87271ab2f0260788d93d6a9bc987d1e0f53659ec",
      "0x3107dcf81412a9b71173b71d5b3d91a4c3b402a7",
      "0x87e65159edafae4bb1ccd0c94c7ec9427409b370",
      "0xc027954c90039f77c3e062dabb44e7c6996800f4",
      "0xcf3a9dfa47a9ddd95c3da9946cb7c0fdcd76d1f3",
      "0xe3770e273985503a49727bb5062a61e0bdbcd799",
    ];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWENTY_FIVE_THOUSAND;
  }
}

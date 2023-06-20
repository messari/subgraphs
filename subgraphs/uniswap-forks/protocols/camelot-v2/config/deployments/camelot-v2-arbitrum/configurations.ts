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
  MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND,
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
      "0x49fe80f28abd3464c0131f07667f23aba906a109",
      "0x3aca67ce7ce58a23c11f7acb1fdcd7ca97a87280",
      "0xcf3d4223059eadc0cab11ce9e9b8b0cbe28f7320",
      "0x5f60e272ffd18d1a9e08441a55d7e8b19dd3f596",
      "0x30141cd8bc39cda323488c31b0d21f766b43b4a3",
      "0x0c8df98817977bf5c09d45e811249e5a878bdac7",
      "0x3bb71b8d7c1756494a57fea97d14601febc08d50",
      "0x0f3074c55478a5c46c8af963b669ca663c2435e8",
      "0xc6488b0fccde76176bf4808067c243909ab91020",
      "0xee1d570036f96afbf43b1e711a19165bb35a5593",
    ];
  }
  getUntrackedTokens(): string[] {
    return [
      "0x91427b0171f4121a5c19f78dd0a4cfe683bcc447",
      "0xff8a64397bec16cc26ea9ae71048c60a22901bd3",
      "0x6b06ff14e09295fe55989b90206d488e4a293983",
      "0xc8951290cbe3562a67f1df199ef6eed72dd4603f",
      "0xe3e7226acb38f772e90c0e4bd6afdbc9c968349b",
      "0x76d849a7a854a0fe6bb787d9c244b3b6463db6e4",
      "0x9f20edeb6bfbdc0fe837ec138fd9b6333c61a123",
      "0xb8387311cfcaf8715ec7a1e6adad8561189b1843",
      "0x61203473a0c0f93717e95d084343350dcbbdc221",
      "0xb88719d85e427dad0fa7a978809c00789fb3b06d",
      "0x43ecebb59dff5e3d12ed29dd3904a8ccfe0044b7",
      "0xfaf84ac3720802139b05eb766a6f0227bef626cf",
      "0x8daab57941c36b833e3947c7d056d63a0b2ee6f8",
      "0x88f6e85a785ed9feac5b0269f1321c6b6131a2c3",
      "0x4ee7fd445ea06474cda563ec74822a3bfeb8a408",
      "0xa79c0ad52686a67c3b3a819ea2ab91fee82f66f3",
      "0x01f93865c7762a87bf3131179b8bd9866de6ee85",
      "0xdd6d1a48950599bb1fa748109ab8c313cd1e61fc",
      "0x0546e8508b3a26bf2a56eda3c1a434e2cda85c1d",
      "0xaa64fdb22aeea0ac949eb353307893d3b33f83e3",
      "0xacb74db7d881c076263cd261e50d6714b78cfc6f",
      "0x520b3c9b05932dfb40496a9988c878a02a5c99af",
      "0x278e1b4ab074464f006bd73d63e0ec2b8715f0c5",
      "0xac6d43d01da88c012516347de21baf26e56073c5",
      "0xf133254d607fbf7650ea4f1191f959752ea18a02",
      "0x7e1a59f281cd1128cd4d1ab2c90a2e27bfe5e70b",
      "0xf62a50717ff598aba123b0fa1858384ba5313b96",
      "0x97b63c981fb2274f51f623c6f3272d422cd1d6f5",
      "0xf03e44322fb768e618da5facad81b53636bfa234",
      "0xc221f7c573a5ad287921a7015ff11027f2232c18",
      "0xa453baf6611e43fa5ba698116ba649b308f18dc7",
      "0x96baa39d1d59dfa972516aa11e0761dbb7db7fa4",
      "0x7756d6f51dc2a2ace8211a74918cde9fff08201c",
      "0x7b4b76cec96064642b7bd81c0cca386fb0b7ff78",
      "0x8aa764f42288827bbcb3238ccf62d095ec7bfd24",
      "0x070622449e7980a1709c576ecbfa1c02b3fd8681",
      "0x0bd45dbda61f99393f4504a5807065eeea235624",
      "0x3c45ff1c0487a4e9aa259905f6a8eef07319c49d",
      "0x06eaa2c25d97c23419032535b42142e63caf185d",
      "0x60efcbdb8deb71f851fc641428f1088e828af6e3",
      "0xa7138f3e2c855ccea2380dc21bfca17543604228",
      "0x96ebb9ffd819dd259006de147c3742f9f0a6df57",
      "0x939f9b559a0a81fcac639111e3476d17497fadbb",
      "0xc971b8a0dd289be391c8a21b6f5df49c9962b848",
      "0x3fbb75df858e5b0164b27e294678fc78d0097d54",
      "0x3fa8d66caa837681d71a05a2c032b1c3f52e84e1",
    ];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND;
  }
}

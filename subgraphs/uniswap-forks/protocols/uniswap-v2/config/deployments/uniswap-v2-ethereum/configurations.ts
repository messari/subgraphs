import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND,
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

export class UniswapV2MainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
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
    return "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")
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
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
      "0x0000000000085d4780b73119b644ae5ecd22b376", // TUSD
      "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // cDAI
      "0x39aa39c021dfbae8fac545936693ac917d5e7563", // cUSDC
      "0x86fadb80d8d2cff3c3680819e4da99c10232ba0f", // EBASE
      "0x57ab1ec28d129707052df4df418d58a2d46d5f51", // sUSD
      "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", // MKR
      "0xc00e94cb662c3520282e6f5717214004a7f26888", // COMP
      "0x514910771af9ca656af840dff83e8264ecf986ca", // LINK
      "0x960b236a07cf122663c4303350609a66a7b288c0", // ANT
      "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", // SNX
      "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", // YFI
      "0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8", // yCurv
      "0x853d955acef822db058eb8505911ed77f175b99e", // FRAX
      "0xa47c8bf37f92abed4a126bda807a7b7498661acd", // WUST
      "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", // UNI
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc", // USDC/wETH created 10008355
      "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", // DAI/wETH created block 10042267
      "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852", // USDT/wETH created block 10093341
    ];
  }
  getUntrackedPairs(): string[] {
    return ["0x9ea3b5b4ec044b70375236a281986106457b20ef"];
  }
  getUntrackedTokens(): string[] {
    return [
      // Uncomment some of these depending on how to pricing turns out.
      "0x77dc1f32a15f0c255b7ae0a1f67fc0b46e7b8bba", // TheOnlyInu
      "0x5dbcf33d8c2e976c6b560249878e6f1491bca25c", // yearn Curve.fi
      "0xe0bcc5246e1561e6f6562fcecc2db910d1af0e6f", // BUSD
      "0x48fb253446873234f2febbf9bdeaa72d9d387f94", // Bancor governance token
      "0xf8b20370896e6f6e5331bdae18081eda9d6854e8", // Akash Network
      "0xcd5a1ff8202ecbad7a2baa3cc4996bebe938146c", // Bit Chinese Yuan
      "0x495b0f097ae25adb5c042cba6a5633175599969d", // UrSa Jugmersu
      "0x186a33d4dbcd700086a26188dcb74e69be463665", // 7Eleven
      "0x35bd8472ed2da9eed980e49b8b92ccbcf625adbd", // Enreich
      "0xb611920d44324655335b5e11ebc9c929faddfbaf", // Lawa USD
      "0xf2bae67cc0b4642b9bc71264cc878598cb0722bd", // Nicaragua Canal
      "0x975ce667d59318e13da8acd3d2f534be5a64087b", // The Whale of Blockchain
      "0x73da99602949c1e333b536889f925e7f4460dea7", // SEOUL.cityswap.io
      "0x4ddebdae4d2c0d6d8044dd2a9845fc68d1bad40d", // MDS
      "0x4c6e796bbfe5eb37f9e3e0f66c009c8bf2a5f428", // FC Bitcoin
      "0x956f47f50a910163d8bf957cf5846d573e7f87ca", // Fei USD
      "0xad6a626ae2b43dcb1b39430ce496d2fa0365ba9c", // PieDAO DEFI Small Cap
      "0x6e10aacb89a28d6fa0fe68790777fec7e7f01890", // Sav3Token
      "0xda6cb58a0d0c01610a29c5a65c303e13e885887c", // cVToken
      "0x3896eac50598ce7c27d921c71710b5824780a4c1", // Ape.cash
      "0x61bfc979ea8160ede9b862798b7833a97bafa02a", // RELEASE COIN
      "0xe5f166c0d8872b68790061317bb6cca04582c912", // TE-FOOD
      "0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7", // FirstBlood Token
      "0x89b51360dbb970d34059d27ed438d0c06cfaa5cb", // Orb Finance V3
      "0x83aab16807b55413bc633a2b67a28cd3898cc10f", // Fake Taxi 2
      "0xea26c4ac16d4a5a106820bc8aee85fd0b7b2b664", // QuarkChain Token
      "0x41dbecc1cdc5517c6f76f6a6e836adbee2754de3", // MedToken
      "0x49d716dfe60b37379010a75329ae09428f17118d", // Pool Dai
      "0xf4a7452f87486504f9ee9d911a1c488127f4f6e7", // LiquidityBomberA
      "0xdb33d49b5a41a97d296b7242a96ebd8ac77b3bb8", // CY Finance
      "0x69b148395ce0015c13e36bffbad63f49ef874e03", // Data Token
      "0x33490ab0464ab2ae206c635b9c646f7031fa6c60", // GORDON
      "0x1ceb05a055c635695fb6b7b28b330f21a8b6afa9", // Greenpump
      "0x75a1169e51a3c6336ef854f76cde949f999720b1", // 88mph.app
      "0xa645264c5603e96c3b0b078cdab68733794b0a71", // Mysterium
      "0x36e220b053f4639a61effc07ee0627f94b4a2fa9", // FM Gallery
      "0x080fa7af7a5cb15f257c3d29f364b347a573e640", // EthereumSafe
      "0x5848bb3be5e3b51c7c3aaf15d7b2b1f034e7713f", // Zero Collateral Dai: V2
      "0x5bc25f649fc4e26069ddf4cf4010f9f706c23831", // DefiDollar
      "0x002eded60c6faf61b5dcfa8fb5832a388fc38523", // DogeStop
      "0x08389495d7456e1951ddf7c3a1314a4bfb646d8b", // CRPT
      "0x8a6aca71a218301c7081d4e96d64292d3b275ce0", // Stable FInance Gov Token
      "0x265ba42daf2d20f3f358a7361d9f69cb4e28f0e6", // UniBombV3
      "0x2229d9054495ac0f0a479a4904d96f2dbb5a9008", // RocChain Token
      "0x3aa8869dc8df33f2bbb7447c9164572da6bd7341", // Degenerate Platform
      "0xfb1e5f5e984c28ad7e228cdaa1f8a0919bb6a09b", // Galaxy solutions
      "0x0d05f8db99423638fbb69c6208d76c678df0f3a5", // GOAT
      "0x77cf1a5c2b2e2b2442acdbe53d1f6fd95419e597", // KeepDAO.com
      "0x177d7a75b9e73d12d49451b03494768a17e33f61", // Tinker Bell
      "0xa9fbb83a2689f4ff86339a4b96874d718673b627", // FireAnts,
      "0x1ceb05a055c635695fb6b7b28b330f21a8b6afa9", // Greenpump
      "0xcca0c9c383076649604ee31b20248bc04fdf61ca", // Bitmax
      "0xbc6e3cfde888e215bf7e425ee88cb133b1210be9",
      "0xd881a753ee98e7d91eb384a8e69ec998ffaa5a33", // IdexTools
      "0x976287ccb0c0f2b7bc0759c1cbaba3c39571f648", // Galaxy Shiba Inu
      "0xd794dd1cada4cf79c9eebaab8327a1b0507ef7d4", // HYVE
      "0x2b467594fe0ba4048f2148e64e47ff8373c6d73e", // Unipower X
      "0x7bb594b3c757801346801f025699e39e7aaf5a49", // Orb
      "0xcfb72ed3647cc8e7fa52e4f121ecdabefc305e7f", // FLAPP
      "0xe6a2dd48d0b604a2fcb447840078e0643659d864", // Dickorn
      "0x278923f10b7e575e129e62b747ee25db6e7bcf6b", // BitFuture
      "0x64f0d720ce8b97ba44cd002005d2dfa3186c0580", // YYFI.finance
      "0x1453dbb8a29551ade11d89825ca812e05317eaeb", // Tendies Token
      "0x1e053d89e08c24aa2ce5c5b4206744dc2d7bd8f5", // Eth-Peg Thunder
      "0x8bcb77a5e9726d291ebe20b69d660b1afe6b7c26", // we
      "0xcb3df3108635932d912632ef7132d03ecfc39080", // Wings
      "0x9224b7a393bdad6a7d04f0d618057012a6ef5f38", // Jelly
      "0xcdcfc0f66c522fd086a1b725ea3c0eeb9f9e8814", // Aurora DAO
      "0x767fe9edc9e0df98e07454847909b5e959d7ca0e", // Illuviuk
      "0x75a1169e51a3c6336ef854f76cde949f999720b1", // 86mph.app
      "0x74559bf30696c65e7374561e7638361dca9e3709", // HooliganCar
      "0x56150c3845c15df287a5ec4878f707ddc273b4e0", // FreeGaza
      "0xe31debd7abff90b06bca21010dd860d8701fd901", // UniBomb
      "0x1fc6ab5e2b4ebb09c37807f988b22b38f3e1c228", // Flamingo.finance
      "0xbba477999ed5b067fddbb1fe1797ba026d89eb23", // SPARK
      "0x9d86f93ff837b80032e3fd7b3f8e1aacc25d3d80", // MIR
      "0x0698dda3c390ff92722f9eed766d8b1727621df9", // Ethereum2Proof-of-stake
      "0xbd62253c8033f3907c0800780662eab7378a4b96", // United States dollar of Galaxy
      "0xed7e17b99804d273eda67fc7d423cc9080ea8431", // Carbon Units
      "0x395c8db957d743a62ac3aaaa4574553bcf2380b3", // block.eth
      "0xd1e2d5085b39b80c9948aeb1b9aa83af6756bcc5", // Wrapped Oxene
      "0x80ab141f324c3d6f2b18b030f1c4e95d4d658778", // DEA
      "0x82a77710495a35549d2add797412b4a4497d33ef", // DOGZ
      "0x5b558564b57e4ff88c6b8d8e7eeee599bf79b368", // MultiMillion
    ];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_FOUR_HUNDRED_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

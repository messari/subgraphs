import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  FeeSwitch,
  MINIMUM_LIQUIDITY_FIVE_THOUSAND,
  MINIMUM_LIQUIDITY_TEN_THOUSAND,
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
  MASTERCHEFV2_SUSHI_PER_BLOCK,
} from "../../../src/common/constants";
import {
  toLowerCase,
  toLowerCaseList,
} from "../../../../../src/common/utils/utils";

export class SushiswapMainnetConfigurations implements Configurations {
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
    return toLowerCase("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac")
      )
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
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return MASTERCHEFV2_SUSHI_PER_BLOCK;
  }
  getReferenceToken(): string {
    return toLowerCase("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  }
  getRewardToken(): string {
    return toLowerCase("0x6B3595068778DD592e39A122f4f5a5cF09C90fE2");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH
      "0x6b175474e89094c44da98b954eedeac495271d0f", // DAI
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      "0xdac17f958d2ee523a2206206994597c13d831ec7", // USDT

      // "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      // "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      // "0x6b175474e89094c44da98b954eedeac495271d0f",
      // "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      // "0x383518188c0c6d7730d91b2c03a03c837814a899",
      // "0xdac17f958d2ee523a2206206994597c13d831ec7",
      // "0x0000000000085d4780b73119b644ae5ecd22b376",
      // "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
      // "0x57ab1ec28d129707052df4df418d58a2d46d5f51",
      // "0x514910771af9ca656af840dff83e8264ecf986ca",
      // "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
      // "0x8798249c2e607446efb7ad49ec89dd1865ff4272",
      // "0x1456688345527be1f37e9e627da0837d6f08c925",
      // "0x3449fc1cd036255ba1eb19d65ff4ba2b8903a69a",
      // "0x2ba592f78db6436527729929aaf6c908497cb200",
      // "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0",
      // "0xa1faa113cbe53436df28ff0aee54275c13b40975",
      // "0xdb0f18081b505a7de20b18ac41856bcb4ba86a1a",
      // "0x04fa0d235c4abf4bcf4787af4cf447de572ef828",
      // "0x3155ba85d5f96b2d030a4966af206230e46849cb",
      // "0x87d73e916d7057945c9bcd8cdd94e42a6f47f776",
      // "0xdfe66b14d37c77f4e9b180ceb433d1b164f0281d",
      // "0xad32a8e6220741182940c5abf610bde99e737b2d",
      // "0xafcE9B78D409bF74980CACF610AFB851BF02F257",
      // "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x397ff1542f962076d0bfe58ea045ffa2d347aca0", // wETH/USDC
      "0x06da0fd433c1a5d7a4faa01111c044910a184553", // wETH/USDT
      "0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [
      "0xbd2f0cd039e0bfcf88901c98c0bfac5ab27566e3", // Dynamic Dollar Set
      "0x618679df9efcd19694bb1daa8d00718eacfa2883", // XYZ Govenance Token
      "0xea7cc765ebc94c4805e3bff28d7e4ae48d06468a", // Near Pad Token
      "0x749b964f3dd571b177fc6e415a07f62b05047da4", // Bad Trip Token
      "0xd417144312dbf50465b1c641d016962017ef6240", // Covalent query Token
      "0xe9f84de264e91529af07fa2c746e934397810334", // Sake Token
      "0x1337def16f9b486faed0293eb623dc8395dfe46a", // Armor Token
      "0x4b4d2e899658fb59b1d518b68fe836b100ee8958", // MIS
    ];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

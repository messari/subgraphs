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
import {
  toLowerCase,
  toLowerCaseList,
} from "../../../../../src/common/utils/utils";

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
    return toLowerCase("0xc35DADB65012eC5796536bD9864eD8773aBc74C4");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xc35DADB65012eC5796536bD9864eD8773aBc74C4")
      )
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.3");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
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
    return toLowerCase("0x74b23882a30290451A17c44f4F05243b6b58C76d");
  }
  getRewardToken(): string {
    return toLowerCase("0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // wFTM
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // fUSD
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // DAI
      "0x74b23882a30290451a17c44f4f05243b6b58c76d", // wETH
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // USDC
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75", // USDC
      "0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E", // DAI
      "0x049d68029688eAbF473097a2fC38ef61633A3C7A", // USDT
      "0xad84341756bf337f5a0164515b1f6f993d194e1f", // fUSD
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xa48869049e36f8bfe0cc5cf655632626988c0140", // wETH/USDC
      "0xd019dd7c760c6431797d6ed170bffb8faee11f99", // wETH/USDT
      "0xd32f2eb49e91aa160946f3538564118388d6246a", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [
      "0x0751f7661f4b5a012cae6afe38e594a6f10d4313", // TAAKIN
      "0xf6129f6705b826dbafaa26e03aad9dd20b9235c6", // ICECREAM
      "0xc61b68d68ba5118afd9048728b4977ebe57130a0", // SUNDAY ICECREAM
      "0x07a5b3d0cb418d07d9ad12cbdb30b5c5c6778531", // DEFI SYSTEM FOR REFERENCE
      "0xe297e06761a5489380538a0308b6f9b4a53bea45", // fWTI Oil
      "0xdaa10abbc76151893cda500580cd78cc0b807c47", // Fast Moon
      "0x0ebdd4cdc95ec1e20d7fddc8aaedba0c840e4975", // Bull Moon
      "0x6160240896d8039b2d901cd59dea95396c94a1c2", // Adult Entertainment Token
    ];
  }
  getBrokenERC20Tokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TWO_HUNDRED_FIFTY_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

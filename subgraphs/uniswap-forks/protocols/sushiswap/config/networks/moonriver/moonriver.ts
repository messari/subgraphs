import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  BIGINT_ZERO,
  FeeSwitch,
  MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND,
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

export class SushiswapMoonriverConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONRIVER;
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
    return toLowerCase("0x639A647fbe20b6c8ac19E48E2de44ea792c62c5C");
  }
  getRewardToken(): string {
    return toLowerCase("0xf390830DF829cf22c53c8840554B98eafC5dCBc2");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c", // wETH
      "0xf50225a84382c74cbdea10b0c176f71fc3de0c4d", // wMOVR
      "0xe6a991ffa8cfe62b0bf6bf72959a3d4f11b2e0f5", // wBTC
      "0xb44a9b6905af7c801311e8f4e76932ee959c663c", // USDT
      "0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d", // USDC
      "0x80a16016cc4a2e6a2caca8a4a498b1699ff0f844", // DAI
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xE3F5a90F9cb311505cd691a46596599aA1A0AD7D", // USDC
      "0x80A16016cC4A2E6a2CACA8a4a498b1699fF0f844", // DAI
      "0xB44a9B6905aF7c801311e8F4E76932ee959c663C", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xb1fdb392fcb3886aea012d5ce70d459d2c77ac08", // wETH/USDC
      "0xb0a594e76a876de40a7fda9819e5c4ec6d9fd222", // wETH/USDT
      "0xc6ca9c83c07a7a3a5461c817ea5210723508a9fd", // wETH/DAI
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return MINIMUM_LIQUIDITY_ONE_HUNDRED_THOUSAND;
  }
}

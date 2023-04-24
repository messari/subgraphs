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
import {
  toLowerCase,
  toLowerCaseList,
} from "../../../../../src/common/utils/utils";

export class VaporDEXAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
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
    return toLowerCase("0xC009a670E2B02e21E7e75AE98e254F467f7ae257");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xC009a670E2B02e21E7e75AE98e254F467f7ae257")
      )
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.29");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.05");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.24");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0.29");
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
    return toLowerCase("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"); // wAVAX
  }
  getRewardToken(): string {
    return toLowerCase("");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wAVAX
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT.e
      "0x83a283641C6B4DF383BCDDf807193284C84c5342", // VPND
      "0x7bddaF6DbAB30224AA2116c4291521C7a60D5f55", // VAPE
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // USDC
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // USDC.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // USDT
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // USDT.e
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x6cd2c4c74125a6ee1999a061b1cea9892e331339", // USDC/wAVAX
      "0x6b4bb60cfd7e9e4fc9a6f3bc7a5a52715443c37d", // USDC.e/wAVAX
      "0x437dcce15eb801093e6427147df9b08f67cb69d5", // USDT/wAVAX
      "0xc0ab231e82894a1b05f7369f617474138d378495", // USDT.e/wAVAX
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
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

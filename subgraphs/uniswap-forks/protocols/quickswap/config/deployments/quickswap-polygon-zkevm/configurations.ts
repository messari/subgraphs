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

export class QuickswapZkevmConfigurations implements Configurations {
  getNetwork(): string {
    return Network.POLYGON_ZKEVM;
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
    return toLowerCase("0x4B9f4d2435Ef65559567e5DbFC1BbB37abC43B57");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0x4B9f4d2435Ef65559567e5DbFC1BbB37abC43B57")
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
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9"); // wETH
  }
  getRewardToken(): string {
    return toLowerCase("");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9", // wETH
      "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", // USDC
      "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", // USDT
      "0xa2036f0538221a77A3937F1379699f44945018d0", // MATIC
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035", // USDC
      "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xc44AD482f24fd750cAeBa387d2726d8653F8c4bB", // wETH/USDC
      "0x4412c7152c658967a3360F0A1472E701bDBeca9E", // wETH/USDT
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

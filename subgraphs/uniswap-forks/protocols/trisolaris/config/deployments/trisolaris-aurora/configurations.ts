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

export class TrisolarisAuroraConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AURORA;
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
    return toLowerCase("0xc66f594268041db60507f00703b152492fb176e7");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xc66f594268041db60507f00703b152492fb176e7")
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
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return toLowerCase("0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d"); // wNEAR
  }
  getRewardToken(): string {
    return toLowerCase("0xFa94348467f64D5A457F75F8bc40495D33c65aBB"); // Trisolaris
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d", // wNEAR
      "0xb12bfca5a55806aaf64e99521918a4bf0fc40802", // USDC
      "0x4988a896b1227218e4a686fde5eabdcabd91571f", // USDT
      "0xfa94348467f64d5a457f75f8bc40495d33c65abb", // TRI
      "0x8bec47865ade3b172a928df8f990bc7f2a3b9f79", // Aurora
      "0xa69d9ba086d41425f35988613c156db9a88a1a96", // USP
      "0xf4eb217ba2454613b15dbdea6e5f22276410e89e", // wBTC
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0xb12bfca5a55806aaf64e99521918a4bf0fc40802", // USDC
      "0x4988a896b1227218e4a686fde5eabdcabd91571f", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0x20f8aefb5697b77e0bb835a8518be70775cda1b0", // USDC/wNEAR
      "0x03b666f3488a7992b2385b12df7f35156d7b29cd", // USDT/wNEAR
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

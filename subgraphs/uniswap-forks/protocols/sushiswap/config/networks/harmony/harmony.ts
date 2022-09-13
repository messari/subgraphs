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

export class SushiswapHarmonyConfigurations implements Configurations {
  getNetwork(): string {
    return Network.HARMONY;
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
    return toLowerCase("0xc35dadb65012ec5796536bd9864ed8773abc74c4");
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        toLowerCase("0xc35dadb65012ec5796536bd9864ed8773abc74c4")
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
    return toLowerCase("0xcf664087a5bb0237a0bad6742852ec6c8d69a27a"); // wONE
  }
  getRewardToken(): string {
    return toLowerCase("0xbec775cb42abfa4288de81f387a9b1a3c4bc552a");
  }
  getWhitelistTokens(): string[] {
    return toLowerCaseList([
      "0xcf664087a5bb0237a0bad6742852ec6c8d69a27a",
      "0x6983d1e6def3690c4d616b13597a09e6193ea013",
      "0x3095c7557bcb296ccc6e363de01b760ba031f2d9",
      "0x985458e523db3d53125813ed68c274899e9dfab4",
      "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f",
      "0xe176ebe47d621b984a73036b9da5d834411ef734",
      "0xef977d2f931c1978db5f6747666fa1eacb0d0339",
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCaseList([
      "0x985458e523db3d53125813ed68c274899e9dfab4", // USDC
      "0xef977d2f931c1978db5f6747666fa1eacb0d0339", // DAI
      "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f", // USDT
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCaseList([
      "0xbf255d8c30dbab84ea42110ea7dc870f01c0013a", // USDC/wETH
      "0x194f4a320cbda15a0910d1ae20e0049cdc50916e", // DAI/wWETH
      "0x2c7862b408bb3dbff277110ffde1b4eaa45c692a", // USDT/wETH
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCaseList([]);
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThresholdTrackVolume(): BigDecimal {
    return MINIMUM_LIQUIDITY_TEN_THOUSAND;
  }
  getMinimumLiquidityThresholdTrackPrice(): BigDecimal {
    return MINIMUM_LIQUIDITY_FIVE_THOUSAND;
  }
}

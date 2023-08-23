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

export class BaseswapBaseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BASE;
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
    return "0xfda619b6d20975be80a10332cd39b9a4b0faa8bb";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xfda619b6d20975be80a10332cd39b9a4b0faa8bb")
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTradeFee(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getProtocolFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0.25");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getLPFeeToOn(blockNumber: BigInt): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getProtocolFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getLPFeeToOff(): BigDecimal {
    return BigDecimal.fromString("0");
  }
  getFeeOnOff(): string {
    return FeeSwitch.ON;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0x4200000000000000000000000000000000000006";
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x4200000000000000000000000000000000000006", // weth
      "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22", // cbweth
      "0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22", // coinbase wsETH
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", // usdc
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // dai
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca", // USDC
      "0x50c5725949a6f0c72e6c4a641f24049a917db0cb", // DAI
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x41d160033c222e6f3722ec97379867324567d883", // USDC/WETH
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
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

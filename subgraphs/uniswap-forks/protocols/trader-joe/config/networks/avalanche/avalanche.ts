import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
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
  TRADER_JOE_AVALANCHE_REWARD_TOKEN_RATE,
} from "../../../src/common/constants";

export class TraderJoeAvalancheConfigurations implements Configurations {
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
    return "0x9ad6c38be94206ca50bb0d90783181662f0cfa10";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x9ad6c38be94206ca50bb0d90783181662f0cfa10")
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
    return TRADER_JOE_AVALANCHE_REWARD_TOKEN_RATE;
  }
  getReferenceToken(): string {
    return "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7";
  }
  getRewardToken(): string {
    return "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wavax
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // usdc
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // usdt.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // usdt
      "0xde3a24028580884448a5397872046a019649b084", // usdt old
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // usdc
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // usdc.e
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // usdt.e
      "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", // usdt
      "0xde3a24028580884448a5397872046a019649b084", // usdt old
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xe4b9865c0866346ba3613ec122040a365637fb46", // usdt/wavax
      "0xf4003f4efbe8691b60249e6afbd307abe7758adb", // usdc/wavax
      "0xed8cbd9f0ce3c6986b22002f03c6475ceb7a6256", // usdt.e/wavax
      "0xa389f9430876455c36478deea9769b7ca4e3ddb1", // usdc.e/wavax
      "0xbb4646a764358ee93c2a9c4a147d5aded527ab73", // usdt old/wavax
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
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

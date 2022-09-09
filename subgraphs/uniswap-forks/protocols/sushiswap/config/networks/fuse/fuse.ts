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

export class SushiswapFuseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FUSE;
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
    return "0x43ea90e2b786728520e4f930d2a71a477bf2737c";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0x43eA90e2b786728520e4f930d2A71a477BF2737C")
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
    return "0xa722c13135930332eb3d749b2f0906559d2c5b99";
  }
  getRewardToken(): string {
    return "0x90708b20ccc1eb95a4fa7c8b18fd2c22a0ff9e78";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x0be9e53fd7edac9f859882afdda116645287c629", // wfuse
      "0xa722c13135930332eb3d749b2f0906559d2c5b99", // weth
      "0x33284f95ccb7b948d9d352e1439561cf83d8d00d", // wbtc
      "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5", // usdc
      "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba", // dai
      "0xfadbbf8ce7d5b7041be672561bba99f79c532e10", // usdt
      "0x249be57637d8b013ad64785404b24aebae9b098b", // fusd
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x620fd5fa44be6af63715ef4e65ddfa0387ad13f5", // usdc
      "0x94ba7a27c7a95863d1bdc7645ac2951e0cca06ba", // dai
      "0xfadbbf8ce7d5b7041be672561bba99f79c532e10", // usdt
      "0x249be57637d8b013ad64785404b24aebae9b098b", // fusd
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xba9ca720e314f42e17e80991c1d0affe47387108", // weth/usdc
      "0xadf3924f44d0ae0242333cde32d75309b30a0fcc", // weth/usdt
      "0x44f5b873d6b2a2ee8309927e22f3359c7f23d428", // weth/dai
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

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

export class SushiswapAvalancheConfigurations implements Configurations {
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
    return "0xc35dadb65012ec5796536bd9864ed8773abc74c4";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xc35DADB65012eC5796536bD9864eD8773aBc74C4")
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
    return RewardIntervalType.NONE;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7";
  }
  getRewardToken(): string {
    return "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76";
  }
  getWhitelistTokens(): string[] {
    return [
      "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7", // wavax
      "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", // weth.e
      "0x50b7545627a5162f82a992c33b87adc75187b218", // wbtc.e
      "0x130966628846bfd36ff31a822705796e8cb8c18d", // mim token
      "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", // usdc.e
      "0xc7198437980c041c805a1edcba50c1ce5db95118", // usdt.e
      "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", // dai.e
      "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76", // sushi.e
      "0xb54f16fb19478766a268f172c9480f8da1a7c9c3", // wonderlnd time
      "0xce1bffbd5374dac86a2893119683f4911a2f7814", // abracadabra spell
    ];
  }
  getStableCoins(): string[] {
    return [
      "0xba7deebbfc5fa1100fb055a87773e1e99cd3507a", // dai
      "0xde3a24028580884448a5397872046a019649b084", // usdt
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x47f1c2a9c9027a10c3b13d1c40dd976c5014339b", // wavax/usdt
      "0x034c1b19dab61b5de448efc1e10a2e592725c893", // wavax/dai
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

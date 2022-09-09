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
export class SpiritSwapFantomConfigurations implements Configurations {
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
    return "0xef45d134b73241eda7703fa787148d9c9f4950b0";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xEF45d134b73241eDa7703fa787148D9C9F4950b0")
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
    return RewardIntervalType.BLOCK;
  }
  getRewardTokenRate(): BigInt {
    return BIGINT_ZERO;
  }
  getReferenceToken(): string {
    return "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83";
  }
  getRewardToken(): string {
    return "0x5cc61a78f164885776aa610fb0fe1257df78e59b";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83", // wftm
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // usdc
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // dai
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x04068da6c83afcfa0e13ba15a6696662335d5b75", // usdc
      "0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e", // dai
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0xe7e90f5a767406eff87fdad7eb07ef407922ec1d", // USDC/FTM
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

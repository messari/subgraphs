import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Factory } from "../../../../../generated/Factory/Factory";
import {
  FeeSwitch,
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

export class UniswapV3CeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
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
    return "0xd9dc0d8f754c027df7ecb4bd381301cec76cd32f";
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString("0xd9dc0d8f754c027DF7eCB4BD381301cEC76CD32F")
    );
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return "0x471ece3750da237f93b8e339c536989b8978a438";
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return [
      "0x471ece3750da237f93b8e339c536989b8978a438", // celo
      "0x765de816845861e75a25fca122bb6898b8b1282a", // cudc
      "0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73", // ceur
    ];
  }
  getStableCoins(): string[] {
    return [
      "0x765de816845861e75a25fca122bb6898b8b1282a", // cusd
    ];
  }
  getStableOraclePools(): string[] {
    return [
      "0x079e7a44f42e9cd2442c3b9536244be634e8f888", // celo/cusd - 0.3%
    ];
  }
  getUntrackedPairs(): string[] {
    return [];
  }
  getUntrackedTokens(): string[] {
    return [];
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("25000");
  }
}

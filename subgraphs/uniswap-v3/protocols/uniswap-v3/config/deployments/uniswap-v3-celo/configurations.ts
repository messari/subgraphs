import { Address, BigDecimal, log } from "@graphprotocol/graph-ts";
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
import { toLowerCase } from "../../../../../src/common/utils/utils";

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
    return "0xd9dc0d8f754c027DF7eCB4BD381301cEC76CD32F".toLowerCase();
  }
  getFactoryContract(): Factory {
    return Factory.bind(
      Address.fromString(
        "0xd9dc0d8f754c027DF7eCB4BD381301cEC76CD32F".toLowerCase()
      )
    );
  }
  getFeeOnOff(): string {
    return FeeSwitch.OFF;
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.NONE;
  }
  getReferenceToken(): string {
    return "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1".toLowerCase();
  }
  getRewardToken(): string {
    return "";
  }
  getWhitelistTokens(): string[] {
    return toLowerCase([
      "0x471EcE3750Da237f93B8E339c536989b8978a438", // CELO
      "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUDC
      "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // cEUR
    ]);
  }
  getStableCoins(): string[] {
    return toLowerCase([
      "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD
    ]);
  }
  getStableOraclePools(): string[] {
    return toLowerCase([
      "0x079e7A44F42E9cd2442C3B9536244be634e8f888", // CELO/cUSD - 0.3%
    ]);
  }
  getUntrackedPairs(): string[] {
    return toLowerCase([]);
  }
  getUntrackedTokens(): string[] {
    return toLowerCase([""]);
  }
  getMinimumLiquidityThreshold(): BigDecimal {
    return BigDecimal.fromString("35000");
  }
}

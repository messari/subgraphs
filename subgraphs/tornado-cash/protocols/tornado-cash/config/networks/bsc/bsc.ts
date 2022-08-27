import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_SCHEMA_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  FACTORY_ADDRESS,
  TORN_ADDRESS,
} from "../../../../../src/common/constants";
import { RewardIntervalType } from "../../../../../src/common/rewards";

export class TornadoCashBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
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
    return FACTORY_ADDRESS.get(Network.BSC)!.toHexString();
  }
  getRewardIntervalType(): string {
    return RewardIntervalType.BLOCK;
  }
  getRewardToken(): string {
    return TORN_ADDRESS.get(Network.BSC)!.toHexString();
  }
}

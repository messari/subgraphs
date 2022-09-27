import { Network, PROTOCOL_SCHEMA_VERSION } from "../../../../../src/constants";
import {
  PROTOCOL_MARKETPLACE_ADDRESS,
  PROTOCOL_MARKETPLACE_NAME,
  PROTOCOL_MARKETPLACE_SLUG,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
} from "../../../src/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class OpenSeaV2Configurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_MARKETPLACE_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_MARKETPLACE_SLUG;
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
  getMarketplaceAddress(): string {
    return PROTOCOL_MARKETPLACE_ADDRESS;
  }
}

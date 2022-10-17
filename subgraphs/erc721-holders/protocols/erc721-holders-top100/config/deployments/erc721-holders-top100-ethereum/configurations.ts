import {
  Network,
  PROTOCOL_SCHEMA_VERSION,
} from "../../../../../src/common/constants";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_SUBGRAPH_VERSION,
} from "../../../src/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";

export class ERC721HoldersTop100Configurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
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
}

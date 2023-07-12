import {
  Network,
  PROTOCOL_SCHEMA_VERSION,
} from "../../../../../src/common/constants";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_SUBGRAPH_VERSION,
  PROTOCOL_METHODOLOGY_VERSION,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../src/common/constants";

export class QuickswapMaticConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
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
    return "0x5757371414417b8c6caad45baef941abc7d3ab32";
  }
  getBrokenERC20Tokens(): string[] {
    return ["0x5d76fa95c308fce88d347556785dd1dd44416272"];
  }
}

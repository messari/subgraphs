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

export class PancakeswapV2BscConfigurations implements Configurations {
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
    return "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";
  }
  getBrokenERC20Tokens(): string[] {
    return [
      "0xfbbd78a1bf76e43d5fc8f1f880f72718040acbe5", // 1
      "0x14111b627d35d3d54505247b4ef1a0754eb02eb7", // ZGLDao
      "0x5285d9d9f784bce2aa7b82cf318d632d423c1047", // Magic
    ];
  }
}

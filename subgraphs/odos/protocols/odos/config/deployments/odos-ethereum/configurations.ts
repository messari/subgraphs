import { Configurations } from "../../../../../configurations/configurations/interface";
import { Network } from "../../../../../src/common/constants";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/constants";

export class OdosEthereumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x76f4eed9fe41262669d0250b2a97db79712ad855";
  }
}

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class KarakArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getProtocolId(): string {
    return "0x399f22ae52a18382a67542b3de9bed52b7b9a4ad";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

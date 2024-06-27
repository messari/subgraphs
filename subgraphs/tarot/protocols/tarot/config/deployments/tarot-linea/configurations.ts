import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotLineaConfigurations implements Configurations {
  getNetwork(): string {
    return Network.LINEA;
  }
  getProtocolId(): string {
    return "0xb6193df61351736e5190bf1deb2e4f0769bd1bf2";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

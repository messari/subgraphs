import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class OrbitKlaytnConfigurations implements Configurations {
  getNetwork(): string {
    return Network.KLAYTN;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x9abc3f6c11dbd83234d6e6b2c373dfc1893f648d";
  }
}

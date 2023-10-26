import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class OrbitCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.CELO;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x979cd0826c2bf62703ef62221a4fea1f23da3777";
  }
}

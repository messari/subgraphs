import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class OrbitHecoConfigurations implements Configurations {
  getNetwork(): string {
    return Network.HECO;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x38c92a7c2b358e2f2b91723e5c4fc7aa8b4d279f";
  }
}

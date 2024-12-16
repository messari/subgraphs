import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class MountainProtocolPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolId(): string {
    return "0x59d9356e565ab3a36dd77763fc0d87feaf85508c";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

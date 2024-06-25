import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class KarakBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolId(): string {
    return "0x4a2b015ccb8658998692db9ed4522b8e846962ed";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotScrollConfigurations implements Configurations {
  getNetwork(): string {
    return Network.SCROLL;
  }
  getProtocolId(): string {
    return "0x2217aec3440e8fd6d49a118b1502e539f88dba55";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

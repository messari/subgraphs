import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolId(): string {
    return "0x36df0a76a124d8b2205fa11766ec2eff8ce38a35";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

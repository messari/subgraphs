import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolId(): string {
    return "0xc20099a3f0728634c1136489074508be7b406d3a";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

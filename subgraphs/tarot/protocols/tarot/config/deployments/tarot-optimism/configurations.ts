import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotOptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
  }
  getProtocolId(): string {
    return "0xba47316035e6c95b31cb55bfb93458ad41e4da04";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

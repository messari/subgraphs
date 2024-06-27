import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotZksyncConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ZKSYNC_ERA;
  }
  getProtocolId(): string {
    return "0xf450b51fb2e1e4f05daf9cf7d9bb97714540b4f4";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

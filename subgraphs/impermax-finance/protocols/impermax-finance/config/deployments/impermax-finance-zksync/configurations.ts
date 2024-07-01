import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class ImpermaxZksyncConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ZKSYNC_ERA;
  }
  getProtocolId(): string {
    return "0x6ce1a2c079871e4d4b91ff29e7d2acbd42b46e36";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TarotBaseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BASE;
  }
  getProtocolId(): string {
    return "0xeb5809eb0f79aab6e53e6374258b29a244dfc12d";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

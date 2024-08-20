import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class StakedListaBnbBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLSTAddress(): Address {
    return Address.fromString("0xb0b84d294e0c75a6abe60171b70edeb2efd14a1b");
  }
}

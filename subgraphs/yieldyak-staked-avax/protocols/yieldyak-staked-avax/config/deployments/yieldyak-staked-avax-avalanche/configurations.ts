import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class YYStakedAvaxConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolId(): string {
    return "0x6026a85e11bd895c934af02647e8c7b4ea2d9808";
  }
  getProtocolIdBI(): string {
    return "45756385483164763772015628191198800763712771278583181747295544980036831301432";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLSTAddress(): Address {
    return Address.fromString("0x6026a85e11bd895c934af02647e8c7b4ea2d9808");
  }
  getWAVAXAddress(): Address {
    return Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  }
}

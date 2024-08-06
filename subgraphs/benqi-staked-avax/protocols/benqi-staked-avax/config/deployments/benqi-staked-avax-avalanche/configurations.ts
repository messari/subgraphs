import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class BenqiStakedAvaxAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getAVAXAddress(): Address {
    return Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  }
  getSAVAXAddress(): Address {
    return Address.fromString("0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be");
  }
}

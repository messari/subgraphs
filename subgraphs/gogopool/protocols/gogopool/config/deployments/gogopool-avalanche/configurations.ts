import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class GoGoPoolAvaxConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolId(): string {
    return "0xa25eaf2906fa1a3a13edac9b9657108af7b703e3";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLSTAddress(): Address {
    return Address.fromString("0xa25eaf2906fa1a3a13edac9b9657108af7b703e3");
  }
  getWAVAXAddress(): Address {
    return Address.fromString("0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7");
  }
}

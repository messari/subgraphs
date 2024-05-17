import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../src/common/constants";

export class MantleStakedEthConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Address {
    return Address.fromString("0xe3cbd06d7dadb3f4e6557bab7edd924cd1489e8f");
  }
  getLSTAddress(): Address {
    return Address.fromString("0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa");
  }
}

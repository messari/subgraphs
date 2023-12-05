import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  Network,
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";

export class FriendTechBaseConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BASE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Address {
    return Address.fromString("0xcf205808ed36593aa40a44f10c7f7c2f67d4a4d4");
  }
  getTreasuryAddress(): Address {
    return Address.fromString("0xdd9176ea3e7559d6b68b537ef555d3e89403f742");
  }
}

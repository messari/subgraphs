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
    return Address.fromString("0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4");
  }
  getTreasuryAddress(): Address {
    return Address.fromString("0xdd9176eA3E7559D6B68b537eF555D3e89403f742");
  }
}

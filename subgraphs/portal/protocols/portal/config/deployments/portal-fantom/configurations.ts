import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PortalFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getNetworkID(): BigInt {
    return BigInt.fromI32(10);
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x126783a6cb203a3e35344528b26ca3a0489a1485");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0x7c9fc5741288cdfdd83ceb07f3ea7e22618d79d2");
  }
}

import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PortalBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getNetworkID(): BigInt {
    return BigInt.fromI32(4);
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x98f3c9e6e3face36baad05fe09d375ef1464288b");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0xb6f6d86a8f9879a9c87f643768d9efc38c1da6e7");
  }
}

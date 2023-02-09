import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PortalMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getNetworkID(): BigInt {
    return BigInt.fromI32(2);
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x98f3c9e6e3face36baad05fe09d375ef1464288b");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0x3ee18b2214aff97000d974cf647e7c347e8fa585");
  }
}

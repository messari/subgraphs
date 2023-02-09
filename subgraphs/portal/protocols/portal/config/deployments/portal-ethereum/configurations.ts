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
    return Address.fromString("0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0x3ee18B2214AFF97000D974cf647E7C347E8fa585");
  }
}

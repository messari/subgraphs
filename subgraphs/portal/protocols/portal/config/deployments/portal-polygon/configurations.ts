import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PortalPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getNetworkID(): BigInt {
    return BigInt.fromI32(5);
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE");
  }
}

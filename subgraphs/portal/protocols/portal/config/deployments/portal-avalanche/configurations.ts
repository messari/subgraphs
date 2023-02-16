import { Address, BigInt } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class PortalAvalancheConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getNetworkID(): BigInt {
    return BigInt.fromI32(6);
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c");
  }
  getBridgeAddress(): Address {
    return Address.fromString("0x0e082F06FF657D94310cB8cE8B0D9a04541d8052");
  }
}

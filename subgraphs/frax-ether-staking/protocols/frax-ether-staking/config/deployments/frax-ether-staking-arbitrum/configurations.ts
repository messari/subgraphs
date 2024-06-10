import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class FraxEtherStakingArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLSTAddress(): Address {
    return Address.fromString("0x95ab45875cffdba1e5f451b950bc2e42c0053f39");
  }
}

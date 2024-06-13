import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class FraxEtherStakingMoonbeamConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MOONBEAM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLSTAddress(): Address {
    return Address.fromString("0xecf91116348af1cffe335e9807f0051332be128d");
  }
}

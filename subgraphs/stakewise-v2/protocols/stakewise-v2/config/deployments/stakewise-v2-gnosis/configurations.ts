import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class StakewiseV2GnosisConfigurations implements Configurations {
  getNetwork(): string {
    return Network.GNOSIS;
  }
  getProtocolId(): string {
    return "0xa4ef9da5ba71cc0d2e5e877a910a37ec43420445";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

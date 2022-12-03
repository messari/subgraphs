import { Configurations } from "../../../../../configurations/configurations/interface";
import { Network } from "../../../../../src/common/constants";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/constants";

export class OdosArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.AVALANCHE;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xfe7ce93ac0f78826cd81d506b07fe9f459c00214";
  }
}

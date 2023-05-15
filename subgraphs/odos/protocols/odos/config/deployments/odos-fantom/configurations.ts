import { Configurations } from "../../../../../configurations/configurations/interface";
import { Network } from "../../../../../src/common/constants";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/constants";

export class OdosFantomConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x061dc8e41C05207BedD6242eA4b342ef294BE359";
  }
}

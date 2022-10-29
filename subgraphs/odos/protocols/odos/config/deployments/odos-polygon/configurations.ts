import { Configurations } from "../../../../../configurations/configurations/interface";
import { Network } from "../../../../../src/common/constants";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/constants";

export class OdosPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0xa32ee1c40594249eb3183c10792bcf573d4da47c";
  }
}

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class AffineRestakingLineaConfigurations implements Configurations {
  getNetwork(): string {
    return Network.LINEA;
  }
  getProtocolId(): string {
    return "0xb838eb4f224c2454f2529213721500faf732bf4d";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

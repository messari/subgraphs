import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class ImpermaxPolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolId(): string {
    return "0x7ed6ef7419cd9c00693d7a4f81c2a151f49c7ac2";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

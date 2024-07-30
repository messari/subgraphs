import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class KelpDAOMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0x036676389e48133b63a802f8635ad39e752d375d";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLRT(): string {
    return "0xa1290d69c65a6fe4df752f95823fae25cb99e5a7";
  }
}

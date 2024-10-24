import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class BlackwingMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0xc6ade8a68026d582ab37b879d188caf7e405dd09";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

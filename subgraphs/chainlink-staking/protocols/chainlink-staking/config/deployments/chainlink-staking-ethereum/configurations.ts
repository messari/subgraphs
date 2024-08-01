import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class ChainlinkStakingMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0xbc10f2e862ed4502144c7d632a3459f49dfcdb5e";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getProtocolToken(): string {
    return "0x514910771af9ca656af840dff83e8264ecf986ca";
  }
  getCommunityPool(): string {
    return "0xbc10f2e862ed4502144c7d632a3459f49dfcdb5e";
  }
  getOperatorPool(): string {
    return "0xa1d76a7ca72128541e9fcacafbda3a92ef94fdc5";
  }
}

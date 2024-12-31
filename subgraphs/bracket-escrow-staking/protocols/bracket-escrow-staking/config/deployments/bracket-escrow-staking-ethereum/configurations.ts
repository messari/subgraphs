import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class BracketEscrowStakingMainnetConfigurations
  implements Configurations
{
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0x9b9d7297c3374dafa2a609d47c79904e467970bc";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

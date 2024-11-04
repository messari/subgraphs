import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class AnzenV2BlastConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BLAST_MAINNET;
  }
  getProtocolId(): string {
    return "0x52056ed29fe015f4ba2e3b079d10c0b87f46e8c6";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
}

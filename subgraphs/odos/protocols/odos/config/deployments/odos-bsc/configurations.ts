import { Configurations } from "../../../../../configurations/configurations/interface";
import { Network } from "../../../../../src/common/constants";
import { PROTOCOL_NAME, PROTOCOL_SLUG } from "../../../src/constants";

export class OdosBscConfigurations implements Configurations {
  getNetwork(): string {
    return Network.BSC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): string {
    return "0x9f138be5aa5cc442ea7cc7d18cd9e30593ed90b9";
  }
}

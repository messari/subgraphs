import { Address } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class SFTMXFANTOMConfigurations implements Configurations {
  getNetwork(): string {
    return Network.FANTOM;
  }
  getProtocolId(): string {
    return "0xb458bfc855ab504a8a327720fcef98886065529b";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLST(): Address {
    return Address.fromString("0xd7028092c830b5c8fce061af2e593413ebbc1fc1");
  }
}

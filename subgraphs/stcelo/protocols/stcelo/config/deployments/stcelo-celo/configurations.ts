import { Address } from "@graphprotocol/graph-ts";
import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class STCELOCeloConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0x4aad04d41fd7fd495503731c5a2579e19054c432";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLST(): Address {
    return Address.fromString("0xC668583dcbDc9ae6FA3CE46462758188adfdfC24");
  }
}

import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class AurusMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0xcb0d82f4dfa503c9e3b8abc7a3caa01175b2da39";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getAgChainlinkDataFeed(): Address {
    return Address.fromString("0x379589227b15f1a12195d3f2d90bbc9f31f95235");
  }
  getAuChainlinkDataFeed(): Address {
    return Address.fromString("0x214ed9da11d2fbe465a6fc601a91e62ebec1a0d6");
  }
}

import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TetherGoldMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0x68749665ff8d2d112fa859aa293f07a622782f38";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getChainlinkDataFeed(): Address {
    return Address.fromString("0x214ed9da11d2fbe465a6fc601a91e62ebec1a0d6");
  }
}

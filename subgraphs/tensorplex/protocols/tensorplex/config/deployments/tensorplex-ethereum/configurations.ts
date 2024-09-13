import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class TensorplexMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0xb60acd2057067dc9ed8c083f5aa227a244044fd6";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getTaoAddress(): Address {
    return Address.fromString("0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44");
  }
  // getEthAddress(): Address {
  //   return Address.fromString("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
  // }
  // getPairAddress(): Address {
  //   return Address.fromString("0x2982d3295a0e1a99e6e88ece0e93ffdfc5c761ae");
  // }
  getLSTAddress(): Address {
    return Address.fromString("0xe6633fd86ea1cc04ef5ffc6c635f92fa0fb782df");
  }
  getChainlinkDataFeed(): Address {
    return Address.fromString("0x1c88503c9a52ae6aae1f9bb99b3b7e9b8ab35459");
  }
}

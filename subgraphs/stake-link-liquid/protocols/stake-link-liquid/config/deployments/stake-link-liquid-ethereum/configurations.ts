import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class StakeLinkLiquidMainnetConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MAINNET;
  }
  getProtocolId(): string {
    return "0xb8b295df2cd735b15be5eb419517aa626fc43cd5";
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getLinkAddress(): Address {
    return Address.fromString("0x514910771af9ca656af840dff83e8264ecf986ca");
  }
  getLSTAddress(): Address {
    return Address.fromString("0xb8b295df2cd735b15be5eb419517aa626fc43cd5");
  }
}

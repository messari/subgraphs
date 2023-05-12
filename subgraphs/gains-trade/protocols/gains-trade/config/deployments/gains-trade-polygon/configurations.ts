import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class GainsTradePolygonConfigurations implements Configurations {
  getNetwork(): string {
    return Network.MATIC;
  }
  getProtocolName(): string {
    return PROTOCOL_NAME;
  }
  getProtocolSlug(): string {
    return PROTOCOL_SLUG;
  }
  getFactoryAddress(): Address {
    return Address.fromString("0xec9581354f7750bc8194e3e801f8ee1d91e2a8ac");
  }
  getDaiAddress(): Address {
    return Address.fromString("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063");
  }
  getVaultAddress(): Address {
    return Address.fromString("0x91993f2101cc758d0deb7279d41e880f7defe827");
  }
  getStorageAddress(): Address {
    return Address.fromString("0xaee4d11a16b2bc65edd6416fb626eb404a6d65bd");
  }
  getPairInfoAddress(): Address {
    return Address.fromString("0xee7442accc1c27f2c69423576d3b1d25b563e977");
  }
  getPairStorageAddress(): Address {
    return Address.fromString("0x6e5326e944f528c243b9ca5d14fe5c9269a8c922");
  }
}

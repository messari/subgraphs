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
    return Address.fromString("0xec9581354f7750Bc8194E3e801f8eE1D91e2a8Ac");
  }
  getDaiAddress(): Address {
    return Address.fromString("0x8f3cf7ad23cd3cadbd9735aff958023239c6a063");
  }
  getVaultAddress(): Address {
    return Address.fromString("0x91993f2101cc758D0dEB7279d41e880F7dEFe827");
  }
  getStorageAddress(): Address {
    return Address.fromString("0xaee4d11a16B2bc65EDD6416Fb626EB404a6D65BD");
  }
  getPairInfoAddress(): Address {
    return Address.fromString("0xee7442accc1c27f2c69423576d3b1d25b563e977");
  }
  getPairStorageAddress(): Address {
    return Address.fromString("0x6e5326e944F528c243B9Ca5d14fe5C9269a8c922");
  }
}

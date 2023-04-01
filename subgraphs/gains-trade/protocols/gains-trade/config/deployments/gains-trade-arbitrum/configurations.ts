import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";
import {
  PROTOCOL_NAME,
  PROTOCOL_SLUG,
} from "../../../../../src/common/constants";
import { Network } from "../../../../../src/sdk/util/constants";

export class GainsTradeArbitrumConfigurations implements Configurations {
  getNetwork(): string {
    return Network.ARBITRUM_ONE;
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
    return Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1");
  }
  getVaultAddress(): Address {
    return Address.fromString("0xd85E038593d7A098614721EaE955EC2022B9B91B");
  }
  getStorageAddress(): Address {
    return Address.fromString("0xcFa6ebD475d89dB04cAd5A756fff1cb2BC5bE33c");
  }
  getPairInfoAddress(): Address {
    return Address.fromString("0x04a5e3cf21B0080B72fAcDca634349A56982D497");
  }
  getPairStorageAddress(): Address {
    return Address.fromString("0xf67Df2a4339eC1591615d94599081Dd037960d4b");
  }
}

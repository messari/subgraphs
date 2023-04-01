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
    return Address.fromString("0xec9581354f7750bc8194e3e801f8ee1d91e2a8ac");
  }
  getDaiAddress(): Address {
    return Address.fromString("0xda10009cbd5d07dd0cecc66161fc93d7c9000da1");
  }
  getVaultAddress(): Address {
    return Address.fromString("0xd85e038593d7a098614721eae955ec2022b9b91b");
  }
  getStorageAddress(): Address {
    return Address.fromString("0xcfa6ebd475d89db04cad5a756fff1cb2bc5be33c");
  }
  getPairInfoAddress(): Address {
    return Address.fromString("0x04a5e3cf21b0080b72facdca634349a56982d497");
  }
  getPairStorageAddress(): Address {
    return Address.fromString("0xf67df2a4339ec1591615d94599081dd037960d4b");
  }
}

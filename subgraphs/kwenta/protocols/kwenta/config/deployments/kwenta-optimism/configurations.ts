import { Address } from "@graphprotocol/graph-ts";

import { Configurations } from "../../../../../configurations/configurations/interface";

import { Network } from "../../../../../src/sdk/util/constants";

export class KwentaOptimismConfigurations implements Configurations {
  getNetwork(): string {
    return Network.OPTIMISM;
  }
  getProtocolName(): string {
    return "Kwenta";
  }
  getProtocolSlug(): string {
    return "kwenta";
  }
  getFactoryAddress(): Address {
    return Address.fromString("0x920cf626a271321c151d027030d5d08af699456b");
  }
  getSUSDAddress(): Address {
    return Address.fromString("0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9");
  }
}

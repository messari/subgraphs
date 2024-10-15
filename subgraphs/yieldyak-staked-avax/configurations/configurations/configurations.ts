import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { YYStakedAvaxConfigurations } from "../../protocols/yieldyak-staked-avax/config/deployments/yieldyak-staked-avax-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.YY_STAKED_AVAX_AVALANCHE: {
      return new YYStakedAvaxConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new YYStakedAvaxConfigurations();
    }
  }
}

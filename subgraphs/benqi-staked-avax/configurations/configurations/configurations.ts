import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { BenqiStakedAvaxAvalancheConfigurations } from "../../protocols/benqi-staked-avax/config/deployments/benqi-staked-avax-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.BENQI_STAKED_AVAX_AVALANCHE: {
      return new BenqiStakedAvaxAvalancheConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new BenqiStakedAvaxAvalancheConfigurations();
    }
  }
}

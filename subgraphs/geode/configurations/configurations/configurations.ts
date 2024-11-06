import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { GeodeAvaxConfigurations } from "../../protocols/geode/config/deployments/geode-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GEODE_AVALANCHE: {
      return new GeodeAvaxConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GeodeAvaxConfigurations();
    }
  }
}

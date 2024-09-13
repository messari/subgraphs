import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { GoGoPoolAvaxConfigurations } from "../../protocols/gogopool/config/deployments/gogopool-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GOGOPOOL_AVALANCHE: {
      return new GoGoPoolAvaxConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GoGoPoolAvaxConfigurations();
    }
  }
}

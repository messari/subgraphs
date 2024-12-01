import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SuzakuAvaxConfigurations } from "../../protocols/suzaku/config/deployments/suzaku-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SUZAKU_AVAX: {
      return new SuzakuAvaxConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SuzakuAvaxConfigurations();
    }
  }
}

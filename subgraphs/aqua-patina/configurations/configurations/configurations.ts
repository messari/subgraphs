import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { APMainnetConfigurations } from "../../protocols/aqua-patina/config/deployments/aqua-patina-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.AP_ETHEREUM: {
      return new APMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new APMainnetConfigurations();
    }
  }
}

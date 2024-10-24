import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { STCELOCeloConfigurations } from "../../protocols/stcelo/config/deployments/stcelo-celo/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STCELO_CELO: {
      return new STCELOCeloConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new STCELOCeloConfigurations();
    }
  }
}

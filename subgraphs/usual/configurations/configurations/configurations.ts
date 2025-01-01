import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { UsualEthereumConfigurations } from "../../protocols/usual/config/deployments/usual-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.USUAL_ETHEREUM: {
      return new UsualEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new UsualEthereumConfigurations();
    }
  }
}

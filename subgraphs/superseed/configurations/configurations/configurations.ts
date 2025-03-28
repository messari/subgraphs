import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SuperseedMainnetConfigurations } from "../../protocols/superseed/config/deployments/superseed-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SUPERSEED_ETHEREUM: {
      return new SuperseedMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SuperseedMainnetConfigurations();
    }
  }
}

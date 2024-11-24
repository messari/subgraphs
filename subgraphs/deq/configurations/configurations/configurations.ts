import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { DeqMainnetConfigurations } from "../../protocols/deq/config/deployments/deq-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.DEQ_ETHEREUM: {
      return new DeqMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new DeqMainnetConfigurations();
    }
  }
}

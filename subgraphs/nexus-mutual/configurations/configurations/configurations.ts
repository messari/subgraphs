import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { NexusMutualMainnetConfigurations } from "../../protocols/nexus-mutual/config/deployments/nexus-mutual-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.NEXUS_MUTUAL_ETHEREUM: {
      return new NexusMutualMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new NexusMutualMainnetConfigurations();
    }
  }
}

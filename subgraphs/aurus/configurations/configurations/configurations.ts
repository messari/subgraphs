import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { AurusMainnetConfigurations } from "../../protocols/aurus/config/deployments/aurus-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.AURUS_ETHEREUM: {
      return new AurusMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new AurusMainnetConfigurations();
    }
  }
}

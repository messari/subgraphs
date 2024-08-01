import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { KelpDAOMainnetConfigurations } from "../../protocols/kelp-dao/config/deployments/kelp-dao-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.KELP_DAO_ETHEREUM: {
      return new KelpDAOMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new KelpDAOMainnetConfigurations();
    }
  }
}

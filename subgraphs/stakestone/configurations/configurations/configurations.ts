import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { StakestoneMainnetConfigurations } from "../../protocols/stakestone/config/deployments/stakestone-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STAKESTONE_ETHEREUM: {
      return new StakestoneMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new StakestoneMainnetConfigurations();
    }
  }
}

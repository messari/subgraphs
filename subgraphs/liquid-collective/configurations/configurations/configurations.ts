import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { LiquidCollectiveMainnetConfigurations } from "../../protocols/liquid-collective/config/deployments/liquid-collective-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.LIQUID_COLLECTIVE_ETHEREUM: {
      return new LiquidCollectiveMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new LiquidCollectiveMainnetConfigurations();
    }
  }
}

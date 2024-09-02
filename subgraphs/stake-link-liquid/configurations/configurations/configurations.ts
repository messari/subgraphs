import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { StakeLinkLiquidMainnetConfigurations } from "../../protocols/stake-link-liquid/config/deployments/stake-link-liquid-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STAKE_LINK_LIQUID_ETHEREUM: {
      return new StakeLinkLiquidMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new StakeLinkLiquidMainnetConfigurations();
    }
  }
}

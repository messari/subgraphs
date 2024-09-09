import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { GaurdaStakingMainnetConfigurations } from "../../protocols/gaurda-staking/config/deployments/gaurda-staking-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GAURDA_STAKING_ETHEREUM: {
      return new GaurdaStakingMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GaurdaStakingMainnetConfigurations();
    }
  }
}

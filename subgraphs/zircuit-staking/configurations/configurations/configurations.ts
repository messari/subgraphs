import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { ZircuitStakingMainnetConfigurations } from "../../protocols/zircuit-staking/config/deployments/zircuit-staking-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ZIRCUIT_STAKING_ETHEREUM: {
      return new ZircuitStakingMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new ZircuitStakingMainnetConfigurations();
    }
  }
}

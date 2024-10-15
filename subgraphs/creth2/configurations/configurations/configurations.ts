import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { CRETHMainnetConfigurations } from "../../protocols/creth2/config/deployments/creth2-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.CRETH_ETHEREUM: {
      return new CRETHMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new CRETHMainnetConfigurations();
    }
  }
}

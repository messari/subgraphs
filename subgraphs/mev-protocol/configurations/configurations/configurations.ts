import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { MEVETHEthereumConfigurations } from "../../protocols/mev-protocol/config/deployments/mev-protocol-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MEVETH_ETHEREUM: {
      return new MEVETHEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MEVETHEthereumConfigurations();
    }
  }
}

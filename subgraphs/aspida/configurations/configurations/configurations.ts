import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { AETHEthereumConfigurations } from "../../protocols/aspida/config/deployments/aspida-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.AETH_ETHEREUM: {
      return new AETHEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new AETHEthereumConfigurations();
    }
  }
}

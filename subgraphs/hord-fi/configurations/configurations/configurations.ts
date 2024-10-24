import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { HETHEthereumConfigurations } from "../../protocols/hord-fi/config/deployments/hord-fi-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.HETH_ETHEREUM: {
      return new HETHEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new HETHEthereumConfigurations();
    }
  }
}

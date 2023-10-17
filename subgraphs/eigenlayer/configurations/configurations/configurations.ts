import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { EigenLayerEthereumConfigurations } from "../../protocols/eigenlayer/config/deployments/eigenlayer-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.EIGEN_LAYER_ETHEREUM: {
      return new EigenLayerEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new EigenLayerEthereumConfigurations();
    }
  }
}

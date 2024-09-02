import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { DineroPxethMainnetConfigurations } from "../../protocols/dinero-pxeth/config/deployments/dinero-pxeth-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.DINERO_PXETH_ETHEREUM: {
      return new DineroPxethMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new DineroPxethMainnetConfigurations();
    }
  }
}

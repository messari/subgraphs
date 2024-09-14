import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { TensorplexMainnetConfigurations } from "../../protocols/tensorplex/config/deployments/tensorplex-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TENSORPLEX_ETHEREUM: {
      return new TensorplexMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TensorplexMainnetConfigurations();
    }
  }
}

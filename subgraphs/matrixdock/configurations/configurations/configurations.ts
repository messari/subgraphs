import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { MatrixdockMainnetConfigurations } from "../../protocols/matrixdock/config/deployments/matrixdock-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MATRIXDOCK_ETHEREUM: {
      return new MatrixdockMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MatrixdockMainnetConfigurations();
    }
  }
}

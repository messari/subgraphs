import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { Powh3dMainnetConfigurations } from "../../protocols/powh3d/config/deployments/powh3d-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.POWH3D_ETHEREUM: {
      return new Powh3dMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new Powh3dMainnetConfigurations();
    }
  }
}
